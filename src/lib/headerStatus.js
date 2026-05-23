import PropTypes from "prop-types";

export const headerStatusShape = PropTypes.exact({
  showCache: PropTypes.bool,
  showWarning: PropTypes.bool,
  warningText: PropTypes.string,
});

export const createHeaderStatus = ({ showCache = false, warningText = "" } = {}) => ({
  showCache,
  showWarning: Boolean(warningText),
  warningText,
});
