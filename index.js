'use strict';

var bind = require('bind');
var upload = require('upload');
var Emitter = require('emitter');
var inlineStyle = require('inline-style');
var classes = require('classes');
var proto = UploadButton.prototype;

Emitter(proto);

module.exports = UploadButton;

function UploadButton(options) {
  this.middleware = [];
  this.options = options || (options = {});
  options.label || (options.label = 'Upload');
  options.progress || (options.progress = 'Upload (%s)');
  options.url || (options.url = './');
  this.init();
}

proto.init = function (el) {
  if (el) {
    this.el = el;
  } else {
    el = this.el = createElement('div');
  }

  this.classes = classes(el);
  this.classes.add('youmeb-upload-button');
  
  this._label = createElement('span', 'youmeb-upload-button-label');
  this._input = createElement('input', 'youmeb-upload-button-input');
  this._progress = createElement('span', 'youmeb-upload-button-progress');

  if (this.options.accept) {
    this._input.setAttribute('accept', this.options.accept);
  }

  el.appendChild(this._label);
  el.appendChild(this._input);
  el.appendChild(this._progress);

  this._progress.inlineStyle = inlineStyle(this._progress);
  this._input.type = 'file';
  this.label(this.options.label);
  this._input.addEventListener('change', bind(this.upload, this));
};

proto.use = function (mw) {
  this.middleware.push(mw);
  return this;
};

proto.label = function (val) {
  this._label.innerHTML = val;
  return this;
};

proto.upload = function () {
  this.emit('beforeUpload');

  var mw = this.middleware;
  var ctx = upload(this.options.url)
    .files(this._input.files);

  var i, len;

  for (i = 0, len = mw.length; i < len; i += 1) {
    mw[i].call(ctx);
  }

  ctx.on('load', bind(this.onload, this));
  ctx.on('error', bind(this.onerror, this));
  ctx.on('progress', bind(this.onprogress, this));

  this.classes.add('uploading');

  ctx.end();
};

proto.onerror = function () {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('error');
  this.label(this.options.label);
  this.classes.remove('uploading');
  this.emit.apply(this, args);
};

proto.onload = function () {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('load');
  this.label(this.options.label);
  this.classes.remove('uploading');
  this.emit.apply(this, args);
};

proto.onprogress = function (e) {
  e.percent = e.loaded / e.total * 100;

  if (e.percent === Infinity) {
    e.percent = 100;
  }

  this.label(this.options.progress.replace('%s', Math.ceil(e.percent)));

  this._progress.inlineStyle
    .set('width', e.percent + '%')
    .render();

  this.emit.apply(this, arguments);
};

function createElement(tagName, className) {
  var el = document.createElement(tagName);
  className && (el.className = className);
  return el;
}
