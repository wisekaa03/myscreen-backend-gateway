export const pdfFonts = {
  Roboto: {
    normal: 'static/fonts/Roboto-Regular.ttf',
    bold: 'static/fonts/Roboto-Medium.ttf',
    italics: 'static/fonts/Roboto-Italic.ttf',
    bolditalics: 'static/fonts/Roboto-MediumItalic.ttf',
  },
};

export const numberFormat = (num: number) => num.toFixed(2);
export const vat = (num: number) => num * 0.2;
