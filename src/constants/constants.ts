import { SpecificFormat } from '@/enums/specific-format.enum';

export const DEMO_MONITORS_COUNT = 5;
export const DEMO_MONITORS_PAY = 14;
export const DEMO_FILE_PAY = 28;

export const formatToContentType: Record<SpecificFormat, string> = {
  [SpecificFormat.PDF]: 'application/pdf',
  [SpecificFormat.XLSX]: 'application/vnd.ms-excel',
};

export const rootFolderName = '\u2039Корень\u203a';
export const exportFolderName = '\u2039Обработанные\u203a';
export const invoiceFolderName = '\u2039Счета\u203a';
export const monitorFolderName = '\u2039Мониторы\u203a';
export const administratorFolderName = '\u2039Администраторская папка\u203a';
export const administratorFolderId = '00000000-0000-0000-0000-000000000000';
export const otherFolderName = '\u2039%\u203a';
export const otherFolderId = '99999999-0000-0000-0000-%';

export const filePreviewXLS =
  '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48"><path fill="#4CAF50" d="M41,10H25v28h16c0.553,0,1-0.447,1-1V11C42,10.447,41.553,10,41,10z"></path><path fill="#FFF" d="M32 15H39V18H32zM32 25H39V28H32zM32 30H39V33H32zM32 20H39V23H32zM25 15H30V18H25zM25 25H30V28H25zM25 30H30V33H25zM25 20H30V23H25z"></path><path fill="#2E7D32" d="M27 42L6 38 6 10 27 6z"></path><path fill="#FFF" d="M19.129,31l-2.411-4.561c-0.092-0.171-0.186-0.483-0.284-0.938h-0.037c-0.046,0.215-0.154,0.541-0.324,0.979L13.652,31H9.895l4.462-7.001L10.274,17h3.837l2.001,4.196c0.156,0.331,0.296,0.725,0.42,1.179h0.04c0.078-0.271,0.224-0.68,0.439-1.22L19.237,17h3.515l-4.199,6.939l4.316,7.059h-3.74V31z"></path></svg>';

export const filePreviewDOC =
  '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="yURKxjsGzuO2sJnz7bo6Na_vCmmOWVBAcll_gr1" x1="25" x2="42" y1="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#33bef0"></stop><stop offset="1" stop-color="#22a5e2"></stop></linearGradient><linearGradient id="yURKxjsGzuO2sJnz7bo6Nb_vCmmOWVBAcll_gr2" x1="29.53" x2="4.68" y1="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset=".11" stop-color="#0d62ab"></stop><stop offset="1" stop-color="#007ad9"></stop></linearGradient></defs><path fill="url(#yURKxjsGzuO2sJnz7bo6Na_vCmmOWVBAcll_gr1)" d="m41,10h-16v28h16c.55,0,1-.45,1-1V11c0-.55-.45-1-1-1Z"></path><path fill="#fff" d="m25,15h14v2h-14v-2Zm0,4h14v2h-14v-2Zm0,4h14v2h-14v-2Zm0,4h14v2h-14v-2Zm0,4h14v2h-14v-2Z"></path><path fill="url(#yURKxjsGzuO2sJnz7bo6Nb_vCmmOWVBAcll_gr2)" d="m27,42l-21-4V10l21-4v36Z"></path><path fill="#fff" d="m21.17,31.01h-2.72l-1.8-8.99c-.1-.48-.16-1-.17-1.58h-.03c-.04.64-.11,1.16-.2,1.58l-1.85,8.99h-2.83l-2.86-14.01h2.68l1.54,9.33c.06.4.11.94.14,1.61h.04c.02-.5.1-1.05.22-1.65l1.97-9.29h2.62l1.78,9.4c.06.35.12.85.17,1.51h.03c.02-.51.07-1.03.16-1.56l1.5-9.35h2.47l-2.87,14.02Z"></path></svg>';

export const filePreviewAudio =
  '<svg height="64" viewBox="0 0 64 64" width="64" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><clipPath id="a"><path d="m440 0h-400v300h400z"/></clipPath><clipPath id="b"><path d="m440 300h-400v179.996h400z"/></clipPath><clipPath id="c"><path d="m440 300h-400v179.996h400z"/></clipPath><clipPath id="d"><path d="m440 50c0-27.6172-22.383-50-50-50h-300c-27.6172 0-50 22.3828-50 50v380c0 27.613 22.3828 50 50 50h240l110-110z"/></clipPath><g transform="matrix(.13333333 0 0 -.13333333 0 64)"><g clip-path="url(#a)"><path d="m90 5c-24.8164 0-45 20.1875-45 45v380c0 24.816 20.1836 45 45 45h237.93l107.07-107.07v-317.93c0-24.8125-20.187-45-45-45z" fill="#f6f6f6"/><path d="m330 480h-240c-27.6172 0-50-22.387-50-50v-380c0-27.6172 22.3828-50 50-50h300c27.617 0 50 22.3828 50 50v320zm-4.141-10 104.141-104.141v-315.859c0-22.0625-17.937-40-40-40h-300c-22.0586 0-40 17.9375-40 40v380c0 22.055 17.9414 40 40 40z" fill="#e0e0e0"/></g><g clip-path="url(#b)"><path d="m90 5c-24.8164 0-45 20.1875-45 45v380c0 24.816 20.1836 45 45 45h237.93l107.07-107.07v-317.93c0-24.8125-20.187-45-45-45z" fill="#9a50a6"/><path d="m330 480h-240c-27.6172 0-50-22.387-50-50v-380c0-27.6172 22.3828-50 50-50h300c27.617 0 50 22.3828 50 50v320zm-4.141-10 104.141-104.141v-315.859c0-22.0625-17.937-40-40-40h-300c-22.0586 0-40 17.9375-40 40v380c0 22.055 17.9414 40 40 40z" fill="#884792"/></g><g clip-path="url(#c)"><g clip-path="url(#d)"><path d="m344.355 384.973 96.79-96.793v96.793z" fill="#884792"/><path d="m440 370h-60c-27.617 0-50 22.387-50 50v60h110z" fill="#cdacd2"/></g></g><g fill="#fff"><path d="m99.9805 417.699h14.7855l10.808-34.586 10.813 34.586h14.258l7.421-57.699h-11.836l-5.097 40.605-12.695-40.605h-5.645l-13.035 40.957-4.817-40.957h-12.0387z"/><path d="m179.563 407.328v-14.765h4.832c2.082 0 3.859.746 5.339 2.242 1.477 1.492 2.219 3.265 2.219 5.316 0 2.344-.84 4.16-2.5 5.449-1.68 1.289-4.043 1.934-7.129 1.934zm-12.18 10.371h19.734c5.305 0 9.582-1.547 12.832-4.633 3.254-3.093 4.875-7.156 4.875-12.199 0-3.308-.801-6.453-2.39-9.422-1.594-2.976-4.004-5.195-7.231-6.66-3.223-1.465-5.973-2.226-8.262-2.285l-7.207-.176v-22.324h-12.351z"/><path d="m224.863 400.035h-11.328c.352 5.125 2.227 9.242 5.645 12.348 3.41 3.105 7.5 4.66 12.285 4.66 5.234 0 9.695-1.488 13.379-4.461 3.672-2.969 5.508-6.547 5.508-10.73 0-4.571-2.247-8.696-6.758-12.387 2.871-1.817 4.961-3.719 6.308-5.695 1.328-1.977 1.993-4.344 1.993-7.098 0-5.25-1.739-9.461-5.235-12.625-3.476-3.168-8.097-4.75-13.84-4.75-5.332 0-9.754 1.516-13.25 4.551-3.496 3.027-5.664 7.242-6.484 12.632h11.602c1.386-5.332 4.035-8 7.957-8 1.964 0 3.625.7 4.972 2.094 1.348 1.395 2.012 3.121 2.012 5.18 0 2.527-.801 4.59-2.441 6.191-1.622 1.602-3.711 2.403-6.25 2.403h-2.071v9.445h1.231c2.668 0 4.804.66 6.418 1.973 1.609 1.316 2.41 3.054 2.41 5.211 0 1.957-.625 3.632-1.914 5.019-1.27 1.387-2.832 2.082-4.668 2.082-4.317 0-6.797-2.683-7.481-8.043"/></g><path d="m186.887 238.727c-4.934-.696-8.606-4.911-8.606-9.911v-42.769-69.797c-4.718 1.875-9.941 3.008-15.527 3.008-19.895 0-36.016-13.262-36.016-29.6291 0-16.3476 16.121-29.6289 36.016-29.6289 19.883 0 35.996 13.2813 35.996 29.6289v99.3091l100.781 14.214v-66.902c-4.718 1.875-9.953 3.008-15.539 3.008-19.89 0-36.012-13.262-36.012-29.629 0-16.3477 16.122-29.629 36.012-29.629 19.887 0 36.008 13.2813 36.008 29.629v96.418 39.953c0 2.902-1.262 5.656-3.437 7.551-2.188 1.902-5.086 2.762-7.958 2.351z" fill="#e0e0e0"/></g></svg>';

export const filePreviewOther =
  '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd"><svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800px" height="800px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><g><path fill="#F9EBB2" d="M58,60V4c0-1.104-0.896-2-2-2H8C6.896,2,6,2.896,6,4v56c0,1.104,0.896,2,2,2h48C57.104,62,58,61.104,58,60z"/><g><path fill="#394240" d="M56,0H8C5.789,0,4,1.789,4,4v56c0,2.211,1.789,4,4,4h48c2.211,0,4-1.789,4-4V4C60,1.789,58.211,0,56,0zM58,60c0,1.104-0.896,2-2,2H8c-1.104,0-2-0.896-2-2V4c0-1.104,0.896-2,2-2h48c1.104,0,2,0.896,2,2V60z"/><path fill="#394240" d="M49,25H15c-0.553,0-1,0.447-1,1s0.447,1,1,1h34c0.553,0,1-0.447,1-1S49.553,25,49,25z"/><path fill="#394240" d="M49,19H15c-0.553,0-1,0.447-1,1s0.447,1,1,1h34c0.553,0,1-0.447,1-1S49.553,19,49,19z"/><path fill="#394240" d="M49,37H15c-0.553,0-1,0.447-1,1s0.447,1,1,1h34c0.553,0,1-0.447,1-1S49.553,37,49,37z"/><path fill="#394240" d="M49,43H15c-0.553,0-1,0.447-1,1s0.447,1,1,1h34c0.553,0,1-0.447,1-1S49.553,43,49,43z"/><path fill="#394240" d="M49,49H15c-0.553,0-1,0.447-1,1s0.447,1,1,1h34c0.553,0,1-0.447,1-1S49.553,49,49,49z"/><path fill="#394240" d="M49,31H15c-0.553,0-1,0.447-1,1s0.447,1,1,1h34c0.553,0,1-0.447,1-1S49.553,31,49,31z"/><path fill="#394240" d="M15,15h16c0.553,0,1-0.447,1-1s-0.447-1-1-1H15c-0.553,0-1,0.447-1,1S14.447,15,15,15z"/></g></g></svg>';

export const filePreviewPDF =
  '<?xml version="1.0" encoding="iso-8859-1"?><svg height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 303.188 303.188" xml:space="preserve"><g>	<polygon style="fill:#E8E8E8;" points="219.821,0 32.842,0 32.842,303.188 270.346,303.188 270.346,50.525"/><path style="fill:#FB3449;" d="M230.013,149.935c-3.643-6.493-16.231-8.533-22.006-9.451c-4.552-0.724-9.199-0.94-13.803-0.936c-3.615-0.024-7.177,0.154-10.693,0.354c-1.296,0.087-2.579,0.199-3.861,0.31c-1.314-1.36-2.584-2.765-3.813-4.202c-7.82-9.257-14.134-19.755-19.279-30.664c1.366-5.271,2.459-10.772,3.119-16.485c1.205-10.427,1.619-22.31-2.288-32.251c-1.349-3.431-4.946-7.608-9.096-5.528c-4.771,2.392-6.113,9.169-6.502,13.973c-0.313,3.883-0.094,7.776,0.558,11.594c0.664,3.844,1.733,7.494,2.897,11.139c1.086,3.342,2.283,6.658,3.588,9.943c-0.828,2.586-1.707,5.127-2.63,7.603c-2.152,5.643-4.479,11.004-6.717,16.161c-1.18,2.557-2.335,5.06-3.465,7.507c-3.576,7.855-7.458,15.566-11.815,23.02c-10.163,3.585-19.283,7.741-26.857,12.625c-4.063,2.625-7.652,5.476-10.641,8.603c-2.822,2.952-5.69,6.783-5.941,11.024c-0.141,2.394,0.807,4.717,2.768,6.137c2.697,2.015,6.271,1.881,9.4,1.225c10.25-2.15,18.121-10.961,24.824-18.387c4.617-5.115,9.872-11.61,15.369-19.465c0.012-0.018,0.024-0.036,0.037-0.054c9.428-2.923,19.689-5.391,30.579-7.205c4.975-0.825,10.082-1.5,15.291-1.974c3.663,3.431,7.621,6.555,11.939,9.164c3.363,2.069,6.94,3.816,10.684,5.119c3.786,1.237,7.595,2.247,11.528,2.886c1.986,0.284,4.017,0.413,6.092,0.335c4.631-0.175,11.278-1.951,11.714-7.57C231.127,152.765,230.756,151.257,230.013,149.935z M119.144,160.245c-2.169,3.36-4.261,6.382-6.232,9.041c-4.827,6.568-10.34,14.369-18.322,17.286c-1.516,0.554-3.512,1.126-5.616,1.002c-1.874-0.11-3.722-0.937-3.637-3.065c0.042-1.114,0.587-2.535,1.423-3.931c0.915-1.531,2.048-2.935,3.275-4.226c2.629-2.762,5.953-5.439,9.777-7.918c5.865-3.805,12.867-7.23,20.672-10.286C120.035,158.858,119.587,159.564,119.144,160.245z M146.366,75.985c-0.602-3.514-0.693-7.077-0.323-10.503c0.184-1.713,0.533-3.385,1.038-4.952c0.428-1.33,1.352-4.576,2.826-4.993c2.43-0.688,3.177,4.529,3.452,6.005c1.566,8.396,0.186,17.733-1.693,25.969c-0.299,1.31-0.632,2.599-0.973,3.883c-0.582-1.601-1.137-3.207-1.648-4.821C147.945,83.048,146.939,79.482,146.366,75.985z M163.049,142.265c-9.13,1.48-17.815,3.419-25.979,5.708c0.983-0.275,5.475-8.788,6.477-10.555c4.721-8.315,8.583-17.042,11.358-26.197c4.9,9.691,10.847,18.962,18.153,27.214c0.673,0.749,1.357,1.489,2.053,2.22C171.017,141.096,166.988,141.633,163.049,142.265z M224.793,153.959c-0.334,1.805-4.189,2.837-5.988,3.121c-5.316,0.836-10.94,0.167-16.028-1.542c-3.491-1.172-6.858-2.768-10.057-4.688c-3.18-1.921-6.155-4.181-8.936-6.673c3.429-0.206,6.9-0.341,10.388-0.275c3.488,0.035,7.003,0.211,10.475,0.664c6.511,0.726,13.807,2.961,18.932,7.186C224.588,152.585,224.91,153.321,224.793,153.959z"/><polygon style="fill:#FB3449;" points="227.64,25.263 32.842,25.263 32.842,0 219.821,0"/><g><path style="fill:#A4A9AD;" d="M126.841,241.152c0,5.361-1.58,9.501-4.742,12.421c-3.162,2.921-7.652,4.381-13.472,4.381h-3.643v15.917H92.022v-47.979h16.606c6.06,0,10.611,1.324,13.652,3.971C125.321,232.51,126.841,236.273,126.841,241.152zM104.985,247.387h2.363c1.947,0,3.495-0.546,4.644-1.641c1.149-1.094,1.723-2.604,1.723-4.529c0-3.238-1.794-4.857-5.382-4.857h-3.348C104.985,236.36,104.985,247.387,104.985,247.387z"/><path style="fill:#A4A9AD;" d="M175.215,248.864c0,8.007-2.205,14.177-6.613,18.509s-10.606,6.498-18.591,6.498h-15.523v-47.979h16.606c7.701,0,13.646,1.969,17.836,5.907C173.119,235.737,175.215,241.426,175.215,248.864z M161.76,249.324c0-4.398-0.87-7.657-2.609-9.78c-1.739-2.122-4.381-3.183-7.926-3.183h-3.773v26.877h2.888c3.939,0,6.826-1.143,8.664-3.43C160.841,257.523,161.76,254.028,161.76,249.324z"/><path style="fill:#A4A9AD;" d="M196.579,273.871h-12.766v-47.979h28.355v10.403h-15.589v9.156h14.374v10.403h-14.374L196.579,273.871L196.579,273.871z"/></g><polygon style="fill:#D1D3D3;" points="219.821,50.525 270.346,50.525 219.821,0"/></g></svg>';
