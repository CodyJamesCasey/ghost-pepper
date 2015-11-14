export default function title(title) {
  return function titleMixin(target) {
    Object.defineProperty(target.prototype, '__title', {
      value:    title,
      writable: true
    });
  };
};