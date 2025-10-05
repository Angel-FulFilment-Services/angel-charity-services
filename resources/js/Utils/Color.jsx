// const colors = [
//     'bg-red-100 text-red-500 border-red-800/20',
//     'bg-blue-100 text-blue-500 border-blue-800/20',
//     'bg-yellow-100 text-yellow-500 border-yellow-800/20',
//     'bg-green-100 text-green-500 border-green-800/20',
//     'bg-pink-100 text-pink-500 border-pink-800/20',
//     'bg-indigo-100 text-indigo-500 border-indigo-800/20',
//     'bg-theme-100 text-theme-500 border-theme-800/20',
//   ];

// const colors = [
//   'bg-theme-100 text-theme-500 border border-theme-300',
//   'bg-gray-100  text-gray-500 border border-gray-300',
// ];

const colors = [
  'bg-theme-100 text-theme-600 dark:bg-theme-800 dark:text-theme-100',
  'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400',
];
  
let colorIndex = 0;

export function getNextColor() {
  const color = colors[colorIndex];
  colorIndex = (colorIndex + 1) % colors.length;
  return color;
}


export function rgbToHex(rgb) {
    // If the input is like "254 215 170"
    if (/^\d+\s+\d+\s+\d+$/.test(rgb)) {
        const [r, g, b] = rgb.split(/\s+/).map(Number);
        return (
            (1 << 24) +
            (r << 16) +
            (g << 8) +
            b
        )
            .toString(16)
            .slice(1)
            .toUpperCase();
    }
    // If the input is like "rgb(254, 215, 170)"
    const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(rgb);
    return result
        ? (
            (1 << 24) +
            (parseInt(result[1]) << 16) +
            (parseInt(result[2]) << 8) +
            parseInt(result[3])
        )
            .toString(16)
            .slice(1)
            .toUpperCase()
        : null;
}