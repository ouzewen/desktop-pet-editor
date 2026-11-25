import AppKit
import SwiftUI

enum AccessoryCategory: String, CaseIterable {
    case hat, hair, eye

    var title: String {
        switch self {
        case .hat: "帽子"
        case .hair: "发饰"
        case .eye: "眼部配饰"
        }
    }
}

struct AccessoryShopItem: Identifiable {
    let id: String
    let name: String
    let category: AccessoryCategory

    static func ownershipID(_ id: String) -> String { id == "A06" ? "A07" : id }

    static func directory(from catalog: AppearanceCatalog) -> [Self] {
        guard let fields = catalog.fieldsByFrame["CAT_ORANGE"] else { return [] }
        let excluded = Set(["A00", "A04", "A05", "A08", "A09", "A12"])
        let headwear = (fields["accessory"] ?? []).compactMap { option -> Self? in
            guard let name = option.accessoryCategory, let category = AccessoryCategory(rawValue: name),
                  category != .eye else { return nil }
            return Self(id: ownershipID(option.id), name: option.name, category: category)
        }
        let eyewear = (fields["eyeAccessory"] ?? []).map {
            Self(id: ownershipID($0.id), name: $0.name, category: .eye)
        }
        var seen = Set<String>()
        return (headwear + eyewear).filter { !excluded.contains($0.id) && seen.insert($0.id).inserted }
    }

    static func legacyOwnership(in config: [String: Any]) -> Set<String> {
        guard config["frame"] as? String == "CAT" else { return [] }
        var ids = Set<String>()
        if let head = config["accessory"] as? String {
            switch head {
            case "A12": ids.formUnion(["A10", "A11"])
            case "A06" where config["palette"] as? String == "CC01": ids.insert("A07")
            case "A01", "A02", "A03", "A07", "A10", "A11": ids.insert(head)
            default: break
            }
        }
        if config["eyeAccessory"] as? String == "A11" { ids.insert("A11") }
        return ids
    }
}

struct AccessoryOwnership: Codable {
    private static let key = "workbenchAccessoryOwnership"
    private static let currentVersion = 1

    let version: Int
    var ids: Set<String>

    static func load() -> Self {
        if let data = UserDefaults.standard.data(forKey: key),
           let value = try? JSONDecoder().decode(Self.self, from: data) {
            return value
        }
        return Self(version: currentVersion, ids: [])
    }

    func save() {
        guard version == Self.currentVersion, let data = try? JSONEncoder().encode(self) else { return }
        UserDefaults.standard.set(data, forKey: Self.key)
    }
}

struct AccessoryShopSheet: View {
    @ObservedObject var state: WorkbenchState
    let theme: WorkbenchTheme
    @Environment(\.dismiss) private var dismiss
    @State private var category: AccessoryCategory?

    private var palette: PixelPalette { theme.palette }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("配饰商店")
                    .font(WorkbenchTypography.sectionTitle)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Button("关闭") { dismiss() }
                    .workbenchButton(palette: palette)
                    .keyboardShortcut(.cancelAction)
                    .accessibilityIdentifier("accessory-shop-close")
            }
            HStack(spacing: 8) {
                filter("全部", category: nil)
                ForEach(AccessoryCategory.allCases, id: \.self) { category in
                    filter(category.title, category: category)
                }
            }
            Text("获取后可在「外观 → 配饰」中佩戴。")
                .font(WorkbenchTypography.supporting())
                .foregroundStyle(palette.inkSoft)
            ScrollView {
                let visible = state.accessoryDirectory.filter { category == nil || $0.category == category }
                if visible.isEmpty {
                    Text("暂无配饰")
                        .foregroundStyle(palette.inkSoft)
                        .frame(maxWidth: .infinity, minHeight: 110)
                } else {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                        ForEach(visible) { item in
                            itemCard(item)
                        }
                    }
                    .padding(.trailing, 4)
                }
            }
            .accessibilityIdentifier("accessory-shop-list")
        }
        .padding(18)
        .frame(width: 640, height: 444)
        .foregroundStyle(palette.ink)
        .font(WorkbenchTypography.body())
        .environment(\.usesWorkbenchWindowTypography, true)
        .workbenchCardSurface(theme)
        .task { await state.loadAccessoryThumbnails() }
    }

    private func filter(_ title: String, category value: AccessoryCategory?) -> some View {
        Button(title) { category = value }
            .workbenchButton(palette: palette, selected: category == value)
            .accessibilityAddTraits(category == value ? .isSelected : [])
            .accessibilityIdentifier("accessory-shop-filter-\(value?.rawValue ?? "all")")
    }

    private func itemCard(_ item: AccessoryShopItem) -> some View {
        let owned = state.ownsAccessory(item.id)
        return VStack(spacing: 6) {
            ZStack {
                if let thumbnail = state.accessoryThumbnails[item.id] {
                    Image(nsImage: thumbnail)
                        .resizable()
                        .interpolation(.none)
                        .scaledToFit()
                        .padding(4)
                } else {
                    PixelGlyph(kind: .workbenchCat, color: palette.border, size: 24)
                }
            }
            .frame(height: 112)
            .frame(maxWidth: .infinity)
            .background(PixelBox(corner: 3).fill(palette.panelDeep))
            .accessibilityHidden(true)
            Text(item.name)
                .font(WorkbenchTypography.body(.medium))
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(height: 32)
            Button(owned ? "已拥有" : "获取") { state.acquireAccessory(item.id) }
                .workbenchButton(palette: palette, prominent: !owned)
                .disabled(owned)
                .accessibilityLabel("\(owned ? "已拥有" : "获取") · \(item.name)")
                .accessibilityIdentifier("accessory-shop-acquire-\(item.id)")
        }
        .padding(8)
        .frame(maxWidth: .infinity)
        .background(PixelBox(corner: 4).fill(palette.panelAlt))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("accessory-shop-item-\(item.id)")
    }
}
