import AVFoundation
import CoreMedia
import ScreenCaptureKit

enum MeetingSource: String, Codable {
    case system, microphone

    var title: String { self == .system ? "系统声音" : "麦克风" }
}

struct MeetingTrack: Codable {
    let source: MeetingSource
    let filename: String
    var offset: TimeInterval = 0
}

enum MeetingError: LocalizedError {
    case microphonePermission, systemAudioPermission, noDisplay, audioFormat, microphoneFailed, speechUnavailable, noAudio

    var errorDescription: String? {
        switch self {
        case .microphonePermission: return "请在系统设置 → 隐私与安全性 → 麦克风中允许桌宠录音。"
        case .systemAudioPermission: return "请在系统设置 → 隐私与安全性 → 屏幕与系统音频录制中允许桌宠录制系统声音。"
        case .noDisplay: return "找不到可用于采集系统声音的显示器。"
        case .audioFormat: return "录音设备的音频格式发生变化，采集已停止。"
        case .microphoneFailed: return "无法从麦克风录音。"
        case .speechUnavailable: return "本机暂时无法使用所选语言的离线转写。"
        case .noAudio: return "没有读到可转写的音频。"
        }
    }
}

@available(macOS 26, *)
final class MeetingCapture: NSObject, SCStreamOutput, SCStreamDelegate, AVAudioRecorderDelegate {
    private struct AudioFile {
        let file: AVAudioFile
        let firstTimestamp: TimeInterval
    }

    private let folder: URL
    private let tracks: [MeetingTrack]
    private let onInterrupt: (Error) -> Void
    private let audioQueue = DispatchQueue(label: "desktop-pet.meeting-audio", qos: .userInitiated)
    // Accessed only on audioQueue. Release files there to finalize their headers.
    private var audioFiles: [MeetingSource: AudioFile] = [:]
    private var failed = false
    private var acceptingAudio = true
    private var stream: SCStream?
    private var microphone: AVAudioRecorder?

    init(folder: URL, tracks: [MeetingTrack], onInterrupt: @escaping (Error) -> Void) {
        self.folder = folder
        self.tracks = tracks
        self.onInterrupt = onInterrupt
    }

    @MainActor
    func start() async throws {
        let mic = tracks.first { $0.source == .microphone }
        if mic != nil {
            let authorized = await AVCaptureDevice.requestAccess(for: .audio)
            guard authorized else { throw MeetingError.microphonePermission }
        }

        guard tracks.contains(where: { $0.source == .system }) else {
            guard let mic else { throw MeetingError.noAudio }
            let recorder = try AVAudioRecorder(url: folder.appendingPathComponent(mic.filename), settings: [
                AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 48_000,
                AVNumberOfChannelsKey: 1, AVEncoderBitRateKey: 96_000,
            ])
            recorder.delegate = self
            guard recorder.record() else { throw MeetingError.microphoneFailed }
            microphone = recorder
            return
        }

        let content: SCShareableContent
        do {
            content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: false)
        } catch let error as NSError where error.domain == SCStreamErrorDomain && error.code == SCStreamError.Code.userDeclined.rawValue {
            throw MeetingError.systemAudioPermission
        }
        guard let display = content.displays.first(where: { $0.displayID == CGMainDisplayID() })
                ?? content.displays.first else { throw MeetingError.noDisplay }
        let filter = SCContentFilter(display: display, excludingWindows: [])
        let config = SCStreamConfiguration()
        config.capturesAudio = true
        config.excludesCurrentProcessAudio = true
        config.sampleRate = 48_000
        config.channelCount = 2
        config.captureMicrophone = mic != nil
        let stream = SCStream(filter: filter, configuration: config, delegate: self)
        try stream.addStreamOutput(self, type: .audio, sampleHandlerQueue: audioQueue)
        if mic != nil {
            try stream.addStreamOutput(self, type: .microphone, sampleHandlerQueue: audioQueue)
        }
        // Register only audio outputs. No screen frames are retrieved or written.
        self.stream = stream
        try await stream.startCapture()
    }

    @MainActor
    func stop() async -> (tracks: [MeetingTrack], error: Error?) {
        microphone?.delegate = nil
        microphone?.stop()
        microphone = nil
        var stopError: Error?
        if let stream {
            do { try await stream.stopCapture() }
            catch { stopError = error }
            self.stream = nil
        }
        let aligned = audioQueue.sync {
            acceptingAudio = false
            let origin = audioFiles.values.map(\.firstTimestamp).min() ?? 0
            let aligned = tracks.map { track in
                var track = track
                if let file = audioFiles[track.source] {
                    track.offset = file.firstTimestamp - origin
                }
                return track
            }
            audioFiles.removeAll()
            return aligned
        }
        return (aligned, stopError)
    }

    func stream(_ stream: SCStream, didStopWithError error: Error) {
        onInterrupt(error)
    }

    func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        onInterrupt(error ?? MeetingError.microphoneFailed)
    }

    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        onInterrupt(MeetingError.microphoneFailed)
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer sample: CMSampleBuffer, of type: SCStreamOutputType) {
        guard acceptingAudio, !failed, sample.isValid, sample.numSamples > 0 else { return }
        let source: MeetingSource = type == .microphone ? .microphone : .system
        guard let track = tracks.first(where: { $0.source == source }) else { return }
        do {
            try append(sample, to: track)
        } catch {
            failed = true
            onInterrupt(error)
        }
    }

    private func append(_ sample: CMSampleBuffer, to track: MeetingTrack) throws {
        guard var description = sample.formatDescription?.audioStreamBasicDescription,
              let format = AVAudioFormat(streamDescription: &description),
              let pcm = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(sample.numSamples))
        else { throw MeetingError.audioFormat }
        pcm.frameLength = pcm.frameCapacity
        let status = CMSampleBufferCopyPCMDataIntoAudioBufferList(
            sample, at: 0, frameCount: Int32(pcm.frameLength), into: pcm.mutableAudioBufferList
        )
        guard status == noErr else { throw NSError(domain: NSOSStatusErrorDomain, code: Int(status)) }
        let timestamp = sample.presentationTimeStamp.seconds
        guard timestamp.isFinite else { throw MeetingError.audioFormat }

        let output: AudioFile
        if let existing = audioFiles[track.source] {
            output = existing
        } else {
            var settings = format.settings
            settings[AVLinearPCMIsNonInterleaved] = false
            let file = try AVAudioFile(forWriting: folder.appendingPathComponent(track.filename),
                                       settings: settings, commonFormat: format.commonFormat,
                                       interleaved: format.isInterleaved)
            output = AudioFile(file: file, firstTimestamp: timestamp)
            audioFiles[track.source] = output
        }
        guard output.file.processingFormat == format else { throw MeetingError.audioFormat }

        // Preserve elapsed time when a capture device skips buffers.
        let expectedFrame = (timestamp - output.firstTimestamp) * format.sampleRate
        let gap = expectedFrame.rounded() - Double(output.file.framePosition)
        if gap > format.sampleRate * 0.02 {
            let capacity = AVAudioFrameCount(min(gap, format.sampleRate))
            guard let silence = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else {
                throw MeetingError.audioFormat
            }
            silence.frameLength = capacity
            for buffer in UnsafeMutableAudioBufferListPointer(silence.mutableAudioBufferList) {
                if let data = buffer.mData { memset(data, 0, Int(buffer.mDataByteSize)) }
            }
            var framesLeft = Int64(gap)
            while framesLeft > 0 {
                silence.frameLength = AVAudioFrameCount(min(framesLeft, Int64(capacity)))
                try output.file.write(from: silence)
                framesLeft -= Int64(silence.frameLength)
            }
        }
        try output.file.write(from: pcm)
    }
}
