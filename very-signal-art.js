// The painted incandescent star is registered at (235, 120) in every cell.
// Its trailing smoke can change shape without moving the signal off the mark.
const frames = 4, cellWidth = 320, cellHeight = 224;
const disabled = new URLSearchParams(globalThis.location?.search).get('fx') === '0';
const image = !disabled && typeof Image === 'function' ? new Image() : null;
let ready = false;
export const verySignalArtReady = image ? new Promise(resolve => {
  image.decoding = 'async';
  image.onload = () => {
    ready = image.naturalWidth === 2 * cellWidth && image.naturalHeight === 2 * cellHeight;
    resolve(ready);
  };
  image.onerror = () => resolve(false);
  image.src = new URL('./fx-very-signal-cohesion.webp', import.meta.url).href;
}) : Promise.resolve(false);

export function drawVerySignal(c, x, y, bearing, age, remaining, zoom, low) {
  if (!ready || !(remaining > 0) || !(age >= 0) || !(zoom > 0)) return false;
  // Ignition, flight and arrival; most of the six-second burn holds its
  // mature plume. Extinction opens up the smoke only as designation expires.
  const phase = age < .4 ? age / .4 : remaining < .7 ? 2 + (1 - remaining / .7)
    : 1 + Math.min(1, (age - .4) / .65) * (.82 + .18 * Math.sin(age * 3));
  const cell = Math.min(frames - 1, low ? Math.round(phase) : Math.floor(phase));
  const mix = low || cell === frames - 1 ? 0 : phase - cell;
  const unit = (.19 + .04 * Math.min(age / .4, 1)) * zoom;
  c.save();
  c.translate(x, y);
  c.rotate(bearing);
  c.imageSmoothingEnabled = true;
  const opacity = c.globalAlpha * Math.min(1, remaining / .25);
  function draw(index, weight) {
    c.globalAlpha = opacity * weight;
    c.drawImage(image, index % 2 * cellWidth, Math.floor(index / 2) * cellHeight, cellWidth, cellHeight,
      -235 * unit, -120 * unit, cellWidth * unit, cellHeight * unit);
  }
  draw(cell, 1 - mix);
  if (mix > 0) draw(cell + 1, mix);
  c.restore();
  return true;
}
