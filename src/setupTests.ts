import '@testing-library/jest-dom';
import { mockWindowApi } from './testUtils';

HTMLDialogElement.prototype.showModal = function() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function() {
  this.open = false;
};

beforeAll(() => {
  mockWindowApi();
});
