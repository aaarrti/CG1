export class Callbackable {
  _handler: Function[] = []
  constructor() {
    let watcher = {
      set: function <T extends keyof Callbackable>(obj: Callbackable, prop: T, value: Callbackable[T]) {
        obj[prop] = value;
        if (obj._handler != undefined) {
          // obj.handler.forEach((handler, idx) => handler.call(obj.parent[idx], prop, value));
          obj._handler.forEach((handler) => handler({ key: prop, value: value }));
        }
        return true;
      }
    }
    return new Proxy(this, watcher)
  }
  addCallback(handler: (KeyValuePair: KeyValuePair<Callbackable>) => void) {
    this._handler.push(handler);
  }
}

export type KeyValuePair<T> = { [N in keyof T]: { key: N, value: T[N] } }[keyof T]
