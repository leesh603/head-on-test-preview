// Only the test renderer registers a context here. Every other surface uses
// the original Canvas drawImage call, including asset preparation and UI.
export const combatSpriteSinks = new WeakMap();

export function drawCombatSprite(ctx, kind, image, ...rect) {
  const sink = combatSpriteSinks.get(ctx);
  if (!sink?.(kind, image, rect)) ctx.drawImage(image, ...rect);
}
