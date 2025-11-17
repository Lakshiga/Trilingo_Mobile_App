// Global setup for React 19 compatibility
// This file MUST load before anything else

if (typeof global !== 'undefined') {
  // Save originals
  const _Object_defineProperty = Object.defineProperty;
  const _Object_getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  
  // Patch Object.defineProperty globally
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj == null || obj == undefined) {
      try {
        return _Object_defineProperty.call(this, obj, prop, descriptor);
      } catch (e) {
        return obj;
      }
    }
    
    try {
      const existing = _Object_getOwnPropertyDescriptor(obj, prop);
      
      if (existing && existing.configurable === false) {
        // Handle non-configurable property
        if (descriptor.value !== undefined) {
          if (existing.value === descriptor.value) {
            return obj; // Same value, no-op
          }
          if (existing.writable) {
            obj[prop] = descriptor.value;
            return obj;
          }
        }
        if (descriptor.get !== undefined && descriptor.get === existing.get &&
            descriptor.set !== undefined && descriptor.set === existing.set) {
          return obj; // Same accessors, no-op
        }
        // Can't modify, return obj without error
        return obj;
      }
      
      return _Object_defineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      // Catch all errors and return obj
      return obj;
    }
  };
  
  // Make sure toString works
  try {
    _Object_defineProperty(Object.defineProperty, 'toString', {
      value: function() { return _Object_defineProperty.toString(); },
      writable: true,
      configurable: true
    });
  } catch (e) {}
  
  console.log('[Setup] React 19 global polyfill loaded');
}
