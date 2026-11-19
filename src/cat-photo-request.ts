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

export function catCrownContrastRequest(pigment: 'dark' | 'orange') {
  const focus = pigment === 'dark'
    ? 'Look for a noticeably dark black or charcoal patch ABOVE the eyes on the forehead, ignoring the body, dark background and shadow.'
    : 'Imagine a vertical center line down the forehead. Look for an orange patch of fur ABOVE the eyes, ignoring the nose, ears and body.';
  return {
    prompt: `${focus} On which side of the center line is the patch chiefly visible? Use the viewer's LEFT and RIGHT. Use unknown if both sides of the forehead are not discernible or the color is unclear. Return one JSON side field.`,
    schema: {
      type: 'object', additionalProperties: false, required: ['side'],
      properties: { side: { type: 'string', enum: ['left', 'right', 'both', 'unknown'] } },
    },
  };
}

export const catBodyMarkings = ['none', 'saddle', 'flank-island', 'hip'] as const;
export const catBodyPigments = ['dark', 'orange', 'gray', 'unknown'] as const;

export function catBodyPhotoRequest(photoCount: number) {
  const choice = (values: readonly string[]) => ({ type: 'string', enum: values });
  return {
    prompt: `The numbered photos show the same real cat. Use photo 1 as the reference for LEFT and RIGHT. Check only the localization of broad coat markings. Use the clearest frame and give its number. The hips are above the back legs, the flank is between the front and back legs, the shoulders are by the neck. Saddle = broad colored patch high across the back or shoulder. Flank-island = clearly bounded colored island on the side of the waist. Hip = colored patch at the rump/upper back leg. Ignore stripes, shadows, or diffuse mottling. Give only the single strongest visible patch per side. If the side cannot be matched confidently to the front of the cat in photo 1, choose none and unknown. Do not invent markings on a hidden side.
White layout: bib = only a white chest bib on a largely colored cat; shoulder = white chest visibly joined to the white shoulders; head-tail = torso and legs almost entirely white, with obvious colored crown/ears AND colored tail. Otherwise use unknown. Look at the color of the actual cap and tail for head-tail.`,
    schema: {
      type: 'object', additionalProperties: false,
      required: ['photo', 'white', 'head', 'tail', 'left', 'leftColor', 'right', 'rightColor'],
      properties: {
        photo: { type: 'integer', enum: Array.from({length: photoCount}, (_, i) => i + 1) },
        white: choice(['bib', 'shoulder', 'head-tail', 'unknown']),
        head: choice(catBodyPigments), tail: choice(catBodyPigments),
        left: choice(catBodyMarkings), leftColor: choice(catBodyPigments),
        right: choice(catBodyMarkings), rightColor: choice(catBodyPigments),
      },
    },
  };
}

export const catVisibleTailRequest = {
  prompt: "Does this cat's pictured TAIL have color? If the long fluffy tail is visibly ginger/orange, answer orange. If visibly dark gray/black answer dark. If white answer white. If hidden answer unknown. Look at the tail curled next to the back legs, not the body. Return one tail field.",
  schema: { type: 'object', additionalProperties: false, required: ['tail'],
    properties: { tail: { type: 'string', enum: ['unknown', 'orange', 'dark', 'gray', 'white'] } } },
};

export const catFlankPatchRequest = {
  prompt: 'Describe ONLY the largest colored patch on the cat’s torso if you see one. Where is it centered: shoulder by the neck, side-waist between front and back legs, or rear-haunch near the tail? If there is no isolated patch or it is hidden, choose unknown. Do not count stripes or low light. Estimate its coverage within the visible torso side only, excluding head, legs and tail: small (under 15%), medium (15–35%), large (over 35%). Use unknown if hidden. For side choose left or right as seen from the cat’s own head facing forward; choose unknown if not sure.',
  schema: { type: 'object', additionalProperties: false, required: ['side', 'location', 'pigment', 'coverage'],
    properties: {
      side: { type: 'string', enum: ['unknown', 'left', 'right'] },
      location: { type: 'string', enum: ['unknown', 'shoulder', 'side-waist', 'rear-haunch'] },
      pigment: { type: 'string', enum: catBodyPigments },
      coverage: { type: 'string', enum: ['unknown', 'small', 'medium', 'large'] },
    } },
};
