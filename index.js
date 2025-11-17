/**
 * React 19 + React Native 0.81 Compatibility Polyfill
 * MUST be at the top before any imports
 */
(function() {
  'use strict';
  
  // Save original methods
  const _defineProperty = Object.defineProperty;
  const _getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  
  // Override Object.defineProperty
  Object.defineProperty = function(obj, prop, descriptor) {
    if (!obj || typeof obj !== 'object' && typeof obj !== 'function') {
      return _defineProperty.call(this, obj, prop, descriptor);
    }

    try {
      const existing = _getOwnPropertyDescriptor(obj, prop);
      
      if (existing && existing.configurable === false) {
        // Property exists and is non-configurable
        
        // If same value, just return
        if (descriptor.value !== undefined && existing.value === descriptor.value) {
          return obj;
        }
        
        // If writable, set directly
        if (existing.writable && descriptor.value !== undefined) {
          obj[prop] = descriptor.value;
          return obj;
        }
        
        // If same getter/setter, return
        if (descriptor.get === existing.get && descriptor.set === existing.set) {
          return obj;
        }
        
        // Otherwise, silently ignore
        return obj;
      }
      
      // Use original for configurable properties
      return _defineProperty.call(this, obj, prop, descriptor);
    } catch (e) {
      // If all else fails, return obj without throwing
      return obj;
    }
  };
  
  // Preserve original toString
  Object.defineProperty.toString = function() {
    return _defineProperty.toString();
  };
})();

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
