// Test Lab launch routing only; normal campaign/endless progression stays native.
export function capitalTestEntry(options={},faction='central'){
 const capital=options.capital===true||options.region==='capital';
 return {capital,region:capital?(faction==='entente'?18:11):options.region};
}
