# ImageGen prompt set

Built-in ImageGen mode. Generated 2026-09-06. Original output directory: `/Users/faisalalrajhi/.codex/generated_images/01a075b8-5159-7162-b81a-c623b2dab3fc`.

## Duck sprite sheet generation

Reference image: `/Users/faisalalrajhi/Documents/ChatGPT/دشداشة Dash game/art/source/hero-run12-sheet.png`

Use case: stylized-concept. Asset type: production-ready transparent 2D platformer sprite sheet, FOUR frames in ONE horizontal row. Reference image 1 is ONLY for identity, costume, proportions and crisp painted arcade style. Generate an original duck-walk animation for exactly this friendly tan-skinned Kuwaiti man with black mustache, white dishdasha, white ghutra and black agal, brown sandals. All FOUR frames side-view facing RIGHT. The man stays in an extremely low forward crouch: hips near heels, knees deeply folded, torso leaning almost horizontal, head tucked forward but face visible. His crown height is only 42% of his normal standing height; keep head size consistent with reference, achieve low height through anatomical pose, never shrink the whole character. Broad compact silhouette, trailing ghutra tucked close to back, hands low near knees. Four successive subtly different crouched footstep phases; alternating front foot and rear foot slide forward, tiny cloth fold changes, never rising. Fixed equal-width cells, matching character pixel scale, feet on exactly the same fixed baseline in every frame, same head crown level, fully visible feet and cloth, centered within each cell with generous transparent gap between frames. Very wide approximately 4:1 canvas, ideally 2048 x 512. True transparent alpha background across ALL empty space; no colored matte, no checkered texture. Clean crisp colorful hand-painted arcade sprite with strong dark edge and subtle blue shading of white cloth, closely matching reference. No floor, no scenery, no dust, no ground shadows, no motion streaks, no text, no labels, no grid borders.

## Hanging awning generation

References: `/Users/faisalalrajhi/Documents/ChatGPT/دشداشة Dash game/art/source/props-sheet.png`, `/Users/faisalalrajhi/Documents/ChatGPT/دشداشة Dash game/art/source/souq.png`

Use case: stylized-concept. Asset type: transparent overhead obstacle sprite for a Kuwait souq 2D side-scrolling arcade platformer. Reference 1 supplies warm painted prop rendering, crisp dark outlines and wood grain; reference 2 supplies traditional Kuwait market atmosphere only. One isolated wide hanging wooden market awning/bar, approximately 3:2 overall canvas aspect, centered and fully visible. A thick broad rectangular assembly of warm honey-brown wooden horizontal planks occupies most of the upper area; its bottom edge has a bold red-and-cream striped cloth awning valance with a shallow scalloped edge. Two sturdy rope attachments emerge upward from the top corners and reach toward the top of the image. This is an OVERHEAD hanging solid hazard with a very clear broad rectangular blocking silhouette, seen straight-on with just slight top/side depth for a 2D platform game. The bottom edge is a single horizontal obstacle boundary for a hero to duck under. Absolutely NO legs, NO columns, NO ground posts, NO vertical support poles beneath the valance. Nothing hangs below the cloth valance. No ground or floor. Modest carved corner detail and a few dark iron fasteners, readable at small game scale. Fully transparent alpha background, clean cutout, no drop shadow, no baked checkerboard, no scene. No people, no shop interior, no merchandise. NO text, no letters, no Arabic writing, no logo, no watermark. Original polished warm painted arcade artwork matching reference props.

## Final transparency correction, applied separately to both generated images

Use case: background-extraction. Edit target: supplied image. Remove ONLY the entire gray-and-white checkerboard background so this is a genuine transparent-background PNG cutout with an alpha channel. The current checkerboard is an error: it is painted pixels, and must be removed. Preserve the original artwork, colors, internal whites, dark outlines, object positions, size, proportions, canvas dimensions, and all small edge details exactly. ALL area outside the illustrated silhouettes must be transparent alpha=0; preserve opaque artwork alpha=255. Do not replace the background with white, black, green, or another checkerboard pattern. Do not redraw, add elements, add shadows, add text, or alter the subject. Export genuine transparency.

## Selected originals

- Duck: `exec-c1c2adce-9cbb-49b5-9ac5-590bf4c8bb6e.png`, 1774×887, RGBA.
- Awning: `exec-e5f42c3c-0d78-4f75-ae5f-10922f604abb.png`, 1536×1024, RGBA.

Technical QA used Sharp to flatten temporary previews on teal, without changing these delivered originals. Transparency is clean. The generated duck cell spacing is approximately even; use dimensions.json for precise visible bounds and baseline registration. Frame bottom baselines differ by up to five source pixels, so register frames to a common bottom anchor during integration.
