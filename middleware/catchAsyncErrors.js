module.exports = (handleFn) => (req, res, next) => {
  Promise.resolve(handleFn(req, res, next)).catch(next);
}