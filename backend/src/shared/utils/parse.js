export default class ParseData {
  static parse(str) {
    const arr = str.split(/\s*\|\s*/);

    return arr;
  }

  static join(arr) {
    const str = arr.join(" | ");

    return str;
  }
}