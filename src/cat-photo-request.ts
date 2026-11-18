export const choices = {
  set: ['mackerel', 'classic', 'spotted', 'blaze-white', 'black-cap', 'calico-mask',
    'calico', 'orange', 'black', 'gray', 'white', 'siamese', 'ragdoll', 'tortie'],
  texture: ['unknown', 'solid', 'striped', 'swirled', 'spotted', 'large-patches', 'mottled'],
  tone: ['unknown', 'orange', 'brown', 'silver', 'gray', 'black', 'cream', 'white'],
  face: ['unknown', 'base', 'none', 'white-muzzle', 'thin-blaze', 'wide-blaze', 'white-face',
    'dark-mask', 'left-dark-eye', 'right-dark-eye'],
  ears: ['unknown', 'upright', 'folded', 'round'],
  chest: ['unknown', 'base', 'plain', 'small-white', 'white-bib', 'wide-white'],
  flank: ['unknown', 'base', 'plain', 'thin-stripes', 'swirls', 'spots', 'left-dark', 'right-dark'],
  leftForeleg: ['unknown', 'base', 'plain', 'rings', 'white-paw', 'white-sock', 'white-leg'],
  rightForeleg: ['unknown', 'base', 'plain', 'rings', 'white-paw', 'white-sock', 'white-leg'],
  tail: ['unknown', 'base', 'solid', 'ringed', 'wide-rings', 'spotted', 'short'],
  leftEye: ['unknown', 'amber', 'green', 'blue', 'gray'],
  rightEye: ['unknown', 'amber', 'green', 'blue', 'gray'],
} as const;

export type PhotoObservations = { [Key in keyof typeof choices]: typeof choices[Key][number] } & { cat: boolean };

export const catPhotoRequest = {
  schema: {
    type: 'object', additionalProperties: false, required: ['cat', ...Object.keys(choices)],
    properties: { cat: { type: 'boolean' }, ...Object.fromEntries(Object.entries(choices).map(([key, values]) =>
      [key, { type: 'string', enum: values }])) },
  },
  prompt: `Inspect the main real cat in the photo. Return only the schema fields. Use cat=false if there is no identifiable cat.
Report tone of the main fur on the cat's back, and its visible texture. Dark gray-brown or tan hairs are not ginger. Do not count backgrounds, glare or pale beige as white fur.
Choose set from the whole cat: mackerel for thin tabby stripes, classic for swirls, spotted for body spots, tortie for mottled black and orange, calico for black and orange patches with clearly white fur, orange for ginger cats. Choose blaze-white for dark fur around both eyes with white on the face or chest, black-cap for a dark forehead above a mostly white face. Use black, gray or white only for the matching solid coats. Siamese and ragdoll have dark extremities and light bodies.
For bilateral fields use IMAGE LEFT and IMAGE RIGHT. Look separately at nose bridge, muzzle, chest, and each paw. A white muzzle alone has no blaze. A white-paw covers just the toes, a white-sock reaches the wrist, and a white-leg covers the full visible leg. Choose plain or none for a visible part without that marking, and unknown for a hidden or unclear part. Add tail rings only if visible.`,
  darkCoat: {
    prompt: 'Determine fur color on the cat in the photograph. Look only at the cat itself, including if it is lying or sideways. Give the main COLOR on the BACK of the cat, the back PATTERN, and whether there is any actual WHITE fur on the cat. Beige, pale brown, glare, and background are never white fur. For ginger choose orange only if it is clearly orange, not tan or brown. If you cannot see the back choose unknown. Use the allowed enum values. No commentary.',
    schema: {
      type: 'object', additionalProperties: false, required: ['body', 'pattern', 'white'],
      properties: {
        body: { type: 'string', enum: ['dark-brown', 'dark-gray', 'black', 'brown', 'gray', 'orange', 'cream', 'white', 'unknown'] },
        pattern: { type: 'string', enum: ['striped', 'spotted', 'swirled', 'black-orange-patches', 'solid', 'unknown'] },
        white: { type: 'string', enum: ['yes', 'no', 'unknown'] },
      },
    },
  },
};

export const catPhotoFeatureRegions = {
  set: 'whole-cat', tone: 'back', texture: 'back', forehead: 'nose-bridge', muzzle: 'muzzle',
  leftFace: 'image-1-left-eye-surround', rightFace: 'image-1-right-eye-surround',
  face: 'face', ears: 'ears', chest: 'chest', flank: 'flank',
  leftForeleg: 'image-1-left-foreleg', rightForeleg: 'image-1-right-foreleg',
  tail: 'tail', leftEye: 'image-1-left-eye', rightEye: 'image-1-right-eye',
} as const;

export function catPhotoViewRequest(photoCount: number) {
  const fields = Object.keys(catPhotoFeatureRegions);
  const numbering = Array.from({ length: photoCount + 1 }, (_, index) => index);
  return {
    prompt: `${catPhotoRequest.prompt}
${photoCount > 1 ? 'The images show the same cat. Image 1 defines LEFT and RIGHT. Use later images to resolve hidden details only when you can match the side to image 1.' : 'There is one image, numbered 1.'}
Give featurePhotos for each field: the image number that most clearly shows that exact part, or 0 if it is unclear. A bright reflection on dark fur is not white. Calico requires visible black, white and orange fur on the cat. Plain black with a white chest is black-and-white. Check each paw separately. On a white foreleg, a local dark patch can coexist with white toes. Do not assign a photo number to guessed markings.`,
    schema: {
      ...catPhotoRequest.schema,
      required: [...catPhotoRequest.schema.required, 'featurePhotos'],
      properties: {
        ...catPhotoRequest.schema.properties,
        featurePhotos: {
          type: 'object', additionalProperties: false, required: fields,
          properties: Object.fromEntries(fields.map(field => [field, { type: 'integer', enum: numbering }])),
        },
      },
    },
  };
}

export const catChestChoices = {
  shape: ['none', 'tuft', 'taper', 'bib', 'continuous', 'unknown'],
  size: ['small', 'medium', 'large', 'unknown'],
  chin: ['joined', 'separate', 'unknown'],
} as const;

export function catChestRequest(photoCount: number) {
  return {
    prompt: `Look ONLY at the white fur on the front of the same cat's CHEST, between its front shoulders and behind the forelegs. Choose the best picture (1-based), ignoring a head-only crop. Do not count the face, paws, hind legs, background or a light reflection as chest fur.
Shape choices: none = visible chest with no white; tuft = small white tuft under throat with colored fur covering most of the chest; taper = long narrow white strip narrowing toward sternum; bib = broad white bib ending in colored fur on the lower chest; continuous = white runs from throat through the breast toward the underside with no band of colored fur; unknown = hidden.
Size: small if less than one-third of chest depth, medium if up to two-thirds, large if most of chest depth. Judge chin independently: joined only if an uninterrupted path of white fur visibly connects the actual underside of the jaw to upper chest. If there is a dark or orange band between even if both are white, choose separate. If hidden choose unknown. Return one JSON object.`,
    schema: {
      type: 'object', additionalProperties: false, required: [...Object.keys(catChestChoices), 'photo'],
      properties: {
        ...Object.fromEntries(Object.entries(catChestChoices).map(([field, values]) => [field, { type: 'string', enum: values }])),
        photo: { type: 'integer', enum: Array.from({ length: photoCount }, (_, index) => index + 1) },
      },
    },
  };
}
