/*!
 * Copyright (c) 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {

  // Setup.
  // ------

  // Establish the root object; `window` in the browser, `global` on the
  // server.
  var root = this;

  // Disable debug mode by default.
  if('undefined' === typeof KINVEY_DEBUG) {
    /**
     * Debug mode. This is a global variable, which can be set anywhere,
     * anytime. Not available in the minified version of the library.
     *
     * @global
     * @type {boolean}
     * @default
     */
    KINVEY_DEBUG = false;
  }

  // Shortcuts.
  var isNone = function(value) {
    return null === value || undefined === value;
  };
  var nativeArraySlice = Array.prototype.slice;

  // Lightweight wrapper for `console.log` for easy debugging.
  // http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
  var log = function() {
    if(root.console) {
      root.console.log.call(root.console, nativeArraySlice.call(arguments));
    }
  };

  // Alias.
  var KEmber = root.Ember;
  var KEmberDS = root.DS;

  // Validate.
  if(isNone(KEmber)) {
    throw new Error('Could not find module: Ember. Did you include all dependencies?');
  }
  if(isNone(KEmberDS)) {
    throw new Error('Could not find module: Ember Data. Did you include it?');
  }

  /**
   * The Kinvey namespace. Contains all library functionality.
   *
   * @exports Kinvey
   */
  var Kinvey = KEmber.Namespace.create();

  // Alias.
  var KPromise = KEmber.RSVP;

  // Storage.
  // --------

  /**
   * Storage mechanism used to store application state.
   *
   * @private
   * @namespace
   */
  var KStorage = /** @lends KStorage */ {
    /**
     * Deletes an item.
     *
     * @param {string} key The key.
     */
    destroy: function(key) {
      localStorage.removeItem(key);
    },

    /**
     * Returns an item, or `null` if not available.
     *
     * @param {string} key The key.
     */
    get: function(key) {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },

    /**
     * Saves an item.
     *
     * @param {string} key The key.
     * @param {*} value The value.
     */
    save: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // Constants.
  // ----------

  /**
   * The Kinvey server.
   *
   * @constant
   * @type {string}
   * @default
   */
  Kinvey.API_ENDPOINT = 'https://baas.kinvey.com';

  /**
   * The Kinvey API version used when communicating with `Kinvey.API_ENDPOINT`.
   *
   * @constant
   * @type {string}
   * @default
   */
  Kinvey.API_VERSION = '3';

  /**
   * The current version of the library.
   *
   * @constant
   * @type {string}
   * @default
   */
  Kinvey.SDK_VERSION = '2.0.0-beta';

  // Properties.
  // -----------

  /**
   * Kinvey App Key.
   *
   * @type {?string}
   */
  Kinvey.appKey = null;

  /**
   * Kinvey App Secret.
   *
   * @type {?string}
   */
  Kinvey.appSecret = null;

  /**
   * Kinvey domain.
   *
   * @type {string}
   */
  Kinvey.domain = Kinvey.API_ENDPOINT;

  /**
   * Kinvey Master Secret.
   *
   * @type {?string}
   */
  Kinvey.masterSecret = null;

  // Type Checking Utilities.
  // ------------------------

  /**
   * Returns whether the specified value is an array.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  var isArray = Array.isArray || function(value) {
    return '[object Array]' === root.toString.call(value);
  };

  /**
   * Returns whether the specified value is a function.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  /*var isFunction = function(value) {
   if('function' !== typeof /./) {
   return 'function' === typeof obj;
   }
   return '[object Function]' === root.toString.call(value);
   };*/

  /**
   * Returns whether the specified value is a number.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  var isNumber = function(value) {
    return '[object Number]' === root.toString.call(value) && !isNaN(value);
  };

  /**
   * Returns whether the specified value is an object.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  var isObject = function(value) {
    return value === Object(value);
  };

  /**
   * Returns whether the specified value is a regular expression.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  var isRegExp = function(value) {
    return '[object RegExp]' === root.toString.call(value);
  };

  /**
   * Returns whether the specified value is a string.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  var isString = function(value) {
    return '[object String]' === root.toString.call(value);
  };

  /**
   * Returns whether the specified value is empty.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  var isEmpty = function(value) {
    // Simple checks.
    if(isNone(value)) {
      return true;
    }
    if(isArray(value) || isString(value)) {
      return 0 === value.length;
    }

    // Traverse object.
    for(var key in value) {
      if(value.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  };

  /**
   * The Kinvey ACL attribute.
   *
   * @mixin
   * @extends {Ember.DS}
   */
  var KAclTransform = KEmberDS.Transform.extend( /** @lends KAclTransform */ {
    /**
     * Deserializes the value for use in a model.
     *
     * @param {Object} value
     * @returns {Object}
     */
    deserialize: function(value) {
      // Cast arguments.
      value = value || {};
      value.groups = value.groups || {};

      // Return human-readable attribute names.
      return {
        creator: value.creator,
        read: value.r || [],
        write: value.w || [],
        globalRead: value.gr,
        globalWrite: value.gw,
        groups: {
          read: value.groups.r || [],
          write: value.groups.w || []
        }
      };
    },

    /**
     * Serializes the value for use outside a model.
     *
     * @param {Object} value
     * @returns {Object}
     */
    serialize: function(value) {
      // Cast arguments.
      value = value || {};

      // Only add attributes that are actually set.
      var result = {};
      if(value.creator) {
        result.creator = value.creator;
      }
      if(!isEmpty(value.read)) {
        result.r = value.read;
      }
      if(!isEmpty(value.write)) {
        result.w = value.write;
      }
      if(value.globalRead) {
        result.gr = value.globalRead;
      }
      if(value.globalWrite) {
        result.gw = value.globalWrite;
      }
      if(isObject(value.groups) && !isEmpty(value.groups.read)) {
        result.groups = result.groups || {}; // Init.
        result.groups.r = value.groups.read;
      }
      if(isObject(value.groups) && !isEmpty(value.groups.write)) {
        result.groups = result.groups || {}; // Init.
        result.groups.w = value.groups.write;
      }

      // Return the result.
      return result;
    }
  });

  // ACL.
  // ----

  // Wrapper for setting permissions on document-level (i.e. models and users).

  /**
   * Define the Kinvey ACL mixin.
   *
   * @private
   * @namespace
   */
  var KAcl = KEmber.Mixin.create( /** @lends KAcl */ {
    /**
     * Access Control List.
     *
     * @type {Object}
     */
    acl: KEmberDS.attr('acl', {
      defaultValue: function() {
        return {
          creator: null,
          read: [],
          write: [],
          globalRead: false,
          globalWrite: false,
          groups: {
            read: [],
            write: []
          }
        };
      }
    }),

    // Define helper methods to mutate the various ACL arrays.

    /**
     * Adds a user to the list of users that are explcitly allowed to read the
     * model.
     *
     * @param {Kinvey.User|string} User User object, or user id.
     * @returns {Kinvey.Model}
     */
    addReader: function(user) {
      user = isObject(user) ? user.get('id') : user; // Cast
      var readers = this.get('acl.read');
      if(-1 === readers.indexOf(user)) {
        readers.push(user);
      }
      return this;
    },

    /**
     * Adds a user group to the list of user groups that are explicitly allowed
     * to read the model.
     *
     * @param {string} group Group id.
     * @returns {Kinvey.Model}
     */
    addReaderGroup: function(group) {
      var groups = this.get('acl.groups.read');
      if(-1 === groups.indexOf(group)) {
        groups.push(group);
      }
      return this;
    },

    /**
     * Adds a user to the list of users that are explicitly allowed to modify the
     * model.
     *
     * @param {Kinvey.User|string} user User object, or user id.
     * @returns {Kinvey.Acl} The ACL.
     */
    addWriter: function(user) {
      user = isObject(user) ? user.get('id') : user; // Cast
      var writers = this.get('acl.write');
      if(-1 === writers.indexOf(user)) {
        writers.push(user);
      }
      return this;
    },

    /**
     * Adds a user group to the list of user groups that are explicitly allowed
     * to modify the model.
     *
     * @param {string} group Group id.
     * @returns {Kinvey.Model}
     */
    addWriterGroup: function(group) {
      var groups = this.get('acl.groups.write');
      if(-1 === groups.indexOf(group)) {
        groups.push(group);
      }
      return this;
    },

    /**
     * Removes a user from the list of users that are explicitly allowed to read
     * the model.
     *
     * @param {Kinvey.User|string} user User object, or user id.
     * @returns {Kinvey.Model}
     */
    removeReader: function(user) {
      user = isObject(user) ? user.get('id') : user; // Cast

      // Lookup reader.
      var pos;
      var readers = this.get('acl.read');
      if(-1 !== (pos = readers.indexOf(user))) {
        readers.splice(pos, 1);
      }
      return this;
    },

    /**
     * Removes a user group from the list of user groups that are explicitly
     * allowed to read the model.
     *
     * @param {string} group Group id.
     * @returns {Kinvey.Model}
     */
    removeReaderGroup: function(group) {
      var pos;
      var groups = this.get('acl.groups.read');
      if(-1 !== (pos = groups.indexOf(group))) {
        groups.splice(pos, 1);
      }
      return this;
    },

    /**
     * Removes a user from the list of users that are explicitly allowed to
     * modify the model.
     *
     * @param {Kinvey.User|string} user User model, or user id.
     * @returns {Kinvey.Model}
     */
    removeWriter: function(user) {
      user = isObject(user) ? user.get('id') : user; // Cast

      // Lookup reader.
      var pos;
      var writers = this.get('acl.write');
      if(-1 !== (pos = writers.indexOf(user))) {
        writers.splice(pos, 1);
      }
      return this;
    },

    /**
     * Removes a user group from the list of user groups that are explicitly
     * allowed to modify the model.
     *
     * @param {string} group Group id.
     * @returns {Kinvey.Model}
     */
    removeWriterGroup: function(group) {
      var pos;
      var groups = this.get('acl.groups.write');
      if(-1 !== (pos = groups.indexOf(group))) {
        groups.splice(pos, 1);
      }
      return this;
    }
  });

  // Data Store.
  // -----------

  /**
   * Define a new Ember class for Kinvey.
   *
   * @memberof! <global>
   * @namespace Kinvey.Model
   * @extends {DS.Model}
   */
  var KModel = Kinvey.Model = KEmberDS.Model.extend(KAcl, /** @lends Kinvey.Model# */ {
    /**
     * Date the model was created on Kinvey.
     *
     * @type {Date}
     */
    createdAt: KEmberDS.attr('date'),

    /**
     * Date the model was last modified on Kinvey.
     *
     * @type {Date}
     */
    lastModifiedAt: KEmberDS.attr('date')
  });

  // Error-handling.
  // ---------------

  // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Error

  /**
   * The Kinvey Error class. Thrown whenever the library encounters an error.
   *
   * @memberof! <global>
   * @class Kinvey.Error
   * @extends {Error}
   * @param {string} message Error message.
   */
  var KError = Kinvey.Error = function(message) {
    // Add stack for debugging purposes.
    this.name = 'Kinvey.Error';
    this.message = message;
    this.stack = (new Error()).stack;

    // Debug.
    if(KINVEY_DEBUG) {
      log('A Kinvey.Error was thrown.', this.message, this.stack);
    }
  };
  KError.prototype = new Error();
  KError.prototype.constructor = KError;

  // ### Client-side.

  /**
   * @constant Kinvey.Error.ALREADY_LOGGED_IN
   * @default
   */
  KError.ALREADY_LOGGED_IN = 'AlreadyLoggedIn';

  /**
   * @constant Kinvey.Error.DATABASE_ERROR
   * @default
   */
  KError.DATABASE_ERROR = 'DatabaseError';

  /**
   * @constant Kinvey.Error.MISSING_APP_CREDENTIALS
   * @default
   */
  KError.MISSING_APP_CREDENTIALS = 'MissingAppCredentials';

  /**
   * @constant Kinvey.Error.MISSING_MASTER_CREDENTIALS
   * @default
   */
  KError.MISSING_MASTER_CREDENTIALS = 'MissingMasterCredentials';

  /**
   * @constant Kinvey.Error.NO_ACTIVE_USER
   * @default
   */
  KError.NO_ACTIVE_USER = 'NoActiveUser';

  /**
   * @constant Kinvey.Error.NOT_LOGGED_IN
   * @default
   */
  KError.NOT_LOGGED_IN = 'NotLoggedIn';

  /**
   * @constant Kinvey.Error.REQUEST_ERROR
   * @default
   */
  KError.REQUEST_ERROR = 'RequestError';

  /**
   * @constant Kinvey.Error.SYNC_ERROR
   * @default
   */
  KError.SYNC_ERROR = 'SyncError';

  // Provide a method to create a client-side error object. For each error, a
  // default error description and debug message are set below.

  var KClientError = {};

  /**
   * Already logged in error.
   */
  KClientError[KError.ALREADY_LOGGED_IN] = {
    description: 'You are already logged in with another user.',
    debug: 'If you want to switch users, logout the active user first, then try again.'
  };

  /**
   * Database error error.
   */
  KClientError[KError.DATABASE_ERROR] = {
    description: 'The local database encountered an error.',
    debug: ''
  };

  /**
   * Missing app credentials error.
   */
  KClientError[KError.MISSING_APP_CREDENTIALS] = {
    description: 'Missing credentials: `Kinvey.appKey` and/or `Kinvey.appSecret`.',
    debug: 'Did you forget to call `Kinvey.init`?'
  };

  /**
   * Missing master credentials error.
   */
  KClientError[KError.MISSING_MASTER_CREDENTIALS] = {
    description: 'Missing credentials: `Kinvey.appKey` and/or `Kinvey.masterSecret`.',
    debug: 'Did you forget to call `Kinvey.init` with your Master Secret?'
  };

  /**
   * No active user error.
   */
  KClientError[KError.NO_ACTIVE_USER] = {
    description: 'You need to be logged in to execute this request.',
    debug: 'Try creating a user using the signup method, or login an existing user.'
  };

  /**
   * Not logged in error.
   */
  KClientError[KError.NOT_LOGGED_IN] = {
    description: 'This user is not logged in.',
    debug: ''
  };

  /**
   * Request error error.
   */
  KClientError[KError.REQUEST_ERROR] = {
    description: 'The request was aborted, timed out, or could not be executed.',
    debug: ''
  };

  KClientError[KError.SYNC_ERROR] = {
    description: '',
    debug: ''
  };

  /**
   * Creates a new client-side error object.
   *
   * @param {string}  constant Client-side error constant.
   * @param {Object} [dict]    Dictionary.
   * @returns {Object}
   */
  var kClientError = function(constant, dict) {
    // Cast arguments.
    dict = dict || {};

    // Return an error object.
    var error = KClientError[constant] || {};
    return {
      name: constant,
      description: dict.description || error.description || '',
      debug: dict.debug || error.debug || ''
    };
  };

  // ### Server-side.

  /**
   * @constant Kinvey.Error.ENTITY_NOT_FOUND
   * @default
   */
  KError.ENTITY_NOT_FOUND = 'EntityNotFound';

  /**
   * @constant Kinvey.Error.COLLECTION_NOT_FOUND
   * @default
   */
  KError.COLLECTION_NOT_FOUND = 'CollectionNotFound';

  /**
   * @constant Kinvey.Error.APP_NOT_FOUND
   * @default
   */
  KError.APP_NOT_FOUND = 'AppNotFound';

  /**
   * @constant Kinvey.Error.USER_NOT_FOUND
   * @default
   */
  KError.USER_NOT_FOUND = 'UserNotFound';

  /**
   * @constant Kinvey.Error.BLOB_NOT_FOUND
   * @default
   */
  KError.BLOB_NOT_FOUND = 'BlobNotFound';

  /**
   * @constant Kinvey.Error.INVALID_CREDENTIALS
   * @default
   */
  KError.INVALID_CREDENTIALS = 'InvalidCredentials';

  /**
   * @constant Kinvey.Error.KINVEY_INTERNAL_ERROR_RETRY
   * @default
   */
  KError.KINVEY_INTERNAL_ERROR_RETRY = 'KinveyInternalErrorRetry';

  /**
   * @constant Kinvey.Error.KINVEY_INTERNAL_ERROR_STOP
   * @default
   */
  KError.KINVEY_INTERNAL_ERROR_STOP = 'KinveyInternalErrorStop';

  /**
   * @constant Kinvey.Error.USER_ALREADY_EXISTS
   * @default
   */
  KError.USER_ALREADY_EXISTS = 'UserAlreadyExists';

  /**
   * @constant Kinvey.Error.USER_UNAVAILABLE
   * @default
   */
  KError.USER_UNAVAILABLE = 'UserUnavailable';

  /**
   * @constant Kinvey.Error.DUPLICATE_END_USERS
   * @default
   */
  KError.DUPLICATE_END_USERS = 'DuplicateEndUsers';

  /**
   * @constant Kinvey.Error.INSUFFICIENT_CREDENTIALS
   * @default
   */
  KError.INSUFFICIENT_CREDENTIALS = 'InsufficientCredentials';

  /**
   * @constant Kinvey.Error.WRITES_TO_COLLECTION_DISALLLOWED
   * @default
   */
  KError.WRITES_TO_COLLECTION_DISALLLOWED = 'WritesToCollectionDisallowed';

  /**
   * @constant Kinvey.Error.INDIRECT_COLLECTION_ACCESS_DISALLOWED
   * @default
   */
  KError.INDIRECT_COLLECTION_ACCESS_DISALLOWED = 'IndirectCollectionAccessDisallowed';

  /**
   * @constant Kinvey.Error.APP_PROBLEM
   * @default
   */
  KError.APP_PROBLEM = 'AppProblem';

  /**
   * @constant Kinvey.Error.PARAMETER_VALUE_OUT_OF_RANGE
   * @default
   */
  KError.PARAMETER_VALUE_OUT_OF_RANGE = 'ParameterValueOutOfRange';

  /**
   * @constant Kinvey.Error.CORS_DISABLED
   * @default
   */
  KError.CORS_DISABLED = 'CORSDisabled';

  /**
   * @constant Kinvey.Error.INVALID_QUERY_SYNTAX
   * @default
   */
  KError.INVALID_QUERY_SYNTAX = 'InvalidQuerySyntax';

  /**
   * @constant Kinvey.Error.MISSING_QUERY
   * @default
   */
  KError.MISSING_QUERY = 'MissingQuery';

  /**
   * @constant Kinvey.Error.JSON_PARSE_ERROR
   * @default
   */
  KError.JSON_PARSE_ERROR = 'JSONParseError';

  /**
   * @constant Kinvey.Error.MISSING_REQUEST_HEADER
   * @default
   */
  KError.MISSING_REQUEST_HEADER = 'MissingRequestHeader';

  /**
   * @constant Kinvey.Error.INCOMPLETE_REQUEST_BODY
   * @default
   */
  KError.INCOMPLETE_REQUEST_BODY = 'IncompleteRequestBody';

  /**
   * @constant Kinvey.Error.MISSING_REQUEST_PARAMETER
   * @default
   */
  KError.MISSING_REQUEST_PARAMETER = 'MissingRequestParameter';

  /**
   * @constant Kinvey.Error.INVALID_IDENTIFIER
   * @default
   */
  KError.INVALID_IDENTIFIER = 'InvalidIdentifier';

  /**
   * @constant Kinvey.Error.BAD_REQUEST
   * @default
   */
  KError.BAD_REQUEST = 'BadRequest';

  /**
   * @constant Kinvey.Error.FEATURE_UNAVAILABLE
   * @default
   */
  KError.FEATURE_UNAVAILABLE = 'FeatureUnavailable';

  /**
   * @constant Kinvey.Error.API_VERSION_NOT_IMPLEMENTED
   * @default
   */
  KError.API_VERSION_NOT_IMPLEMENTED = 'APIVersionNotImplemented';

  /**
   * @constant Kinvey.Error.API_VERSION_NOT_AVAILABLE
   * @default
   */
  KError.API_VERSION_NOT_AVAILABLE = 'APIVersionNotAvailable';

  /**
   * @constant Kinvey.Error.INPUT_VALIDATION_FAILED
   * @default
   */
  KError.INPUT_VALIDATION_FAILED = 'InputValidationFailed';

  /**
   * @constant Kinvey.Error.BL_RUNTIME_ERROR
   * @default
   */
  KError.BL_RUNTIME_ERROR = 'BLRuntimeError';

  /**
   * @constant Kinvey.Error.BL_SYNTAX_ERROR
   * @default
   */
  KError.BL_SYNTAX_ERROR = 'BLSyntaxError';

  /**
   * @constant Kinvey.Error.BL_TIMEOUT_ERROR
   * @default
   */
  KError.BL_TIMEOUT_ERROR = 'BLTimeoutError';

  /**
   * @constant Kinvey.Error.OAUTH_TOKEN_REFRESH_ERROR
   * @default
   */
  KError.OAUTH_TOKEN_REFRESH_ERROR = 'OAuthTokenRefreshError';

  /**
   * @constant Kinvey.Error.BL_VIOLATION_ERROR
   * @default
   */
  KError.BL_VIOLATION_ERROR = 'BLViolationError';

  /**
   * @constant Kinvey.Error.BL_INTERNAL_ERROR
   * @default
   */
  KError.BL_INTERNAL_ERROR = 'BLInternalError';

  /**
   * @constant Kinvey.Error.THIRD_PARTY_TOS_UNACKED
   * @default
   */
  KError.THIRD_PARTY_TOS_UNACKED = 'ThirdPartyTOSUnacked';

  /**
   * @constant Kinvey.Error.STALE_REQUEST
   * @default
   */
  KError.STALE_REQUEST = 'StaleRequest';

  /**
   * @constant Kinvey.Error.DATA_LINK_PARSE_ERROR
   * @default
   */
  KError.DATA_LINK_PARSE_ERROR = 'DataLinkParseError';

  /**
   * @constant Kinvey.Error.NOT_IMPLEMENTED_ERROR
   * @default
   */
  KError.NOT_IMPLEMENTED_ERROR = 'NotImplementedError';

  /**
   * @constant Kinvey.Error.EMAIL_VERIFICATION_REQUIRED
   * @default
   */
  KError.EMAIL_VERIFICATION_REQUIRED = 'EmailVerificationRequired';

  /**
   * @constant Kinvey.Error.SORT_LIMIT_EXCEEDED
   * @default
   */
  KError.SORT_LIMIT_EXCEEDED = 'SortLimitExceeded';

  /**
   * @constant Kinvey.Error.INVALID_SHORT_URL
   * @default
   */
  KError.INVALID_SHORT_URL = 'InvalidShortURL';

  /**
   * @constant Kinvey.Error.INVAID_OR_MISSING_NONCE
   * @default
   */
  KError.INVAID_OR_MISSING_NONCE = 'InvalidOrMissingNonce';

  /**
   * @constant Kinvey.Error.MISSING_CONFIGURATION
   * @default
   */
  KError.MISSING_CONFIGURATION = 'MissingConfiguration';

  /**
   * @constant Kinvey.Error.ENDPOINT_DOES_NOT_EXIST
   * @default
   */
  KError.ENDPOINT_DOES_NOT_EXIST = 'EndpointDoesNotExist';

  /**
   * @constant Kinvey.Error.DISALLOWED_QUERY_SYNTAX
   * @default
   */
  KError.DISALLOWED_QUERY_SYNTAX = 'DisallowedQuerySyntax';

  /**
   * @constant Kinvey.Error.MALFORMED_AUTHENTICATION_HEADER
   * @default
   */
  KError.MALFORMED_AUTHENTICATION_HEADER = 'MalformedAuthenticationHeader';

  /**
   * @constant Kinvey.Error.APP_ARCHIVED
   * @default
   */
  KError.APP_ARCHIVED = 'AppArchived';

  /**
   * @constant Kinvey.Error.BL_NOT_SUPPORTED_FOR_ROUTE
   * @default
   */
  KError.BL_NOT_SUPPORTED_FOR_ROUTE = 'BLNotSupportedForRoute';

  /**
   * @constant Kinvey.Error.USER_LOCKED_DOWN
   * @default
   */
  KError.USER_LOCKED_DOWN = 'UserLockedDown';

  /**
   * @constant Kinvey.Error.DISALLOWED_FUNCTION
   * @default
   */
  KError.DISALLOWED_FUNCTION = 'DisallowedFunction';

  /**
   * @constant Kinvey.Error.BL_MISMATCH_REQUEST_ID
   * @default
   */
  KError.BL_MISMATCH_REQUEST_ID = 'BLMismatchedRequestId';

  /**
   * @constant Kinvey.Error.OAUTH_TOKEN_REFRESH_ERROR
   * @default
   */
  KError.OAUTH_TOKEN_REFRESH_ERROR = 'OAuthTokenRefreshError';

  /**
   * @constant Kinvey.Error.RESULT_SET_SIZE_EXCEEDED
   * @default
   */
  KError.RESULT_SET_SIZE_EXCEEDED = 'ResultSetSizeExceeded';

  // Exports.
  // --------

  // Exported for the server, as AMD module, and for the browser.
  if('object' === typeof module && 'object' === typeof module.exports) {
    module.exports = Kinvey;
  }
  else if('function' === typeof define && define.amd) {
    define('kinvey', [], function() {
      return Kinvey;
    });
  }
  else {
    root.Kinvey = Kinvey;
  }

  // The DataStore namespace.
  var DATASTORE = 'appdata';

  // Querying.
  // ---------

  // The `Kinvey.Query` class provides an easy way to build queries, which can
  // be passed to one of the REST API methods to query data.

  /**
   * The `Kinvey.Query` class.
   *
   * @memberof! <global>
   * @class Kinvey.Query
   */
  var KQuery = Kinvey.Query = function() {
    /**
     * List of fields to retrieve.
     *
     * @memberof Kinvey.Query#
     * @type {Array}
     */
    this.fields = [];

    /**
     * Number of documents to retrieve.
     *
     * @memberof Kinvey.Query#
     * @type {?integer}
     */
    this.limit = null;

    /**
     * The MongoDB query.
     *
     * @memberof Kinvey.Query#
     * @type {Object}
     */
    this.query = {};

    /**
     * Number of documents to skip from the start.
     *
     * @memberof Kinvey.Query#
     * @type {integer}
     */
    this.skip = 0;

    /**
     * Map of fields to sort by.
     *
     * @memberof Kinvey.Query#
     * @type {Object}
     */
    this.sort = {};

    /**
     * The parent query.
     *
     * @private
     * @memberof Kinvey.Query#
     * @type {?Kinvey.Query}
     */
    this._parent = null;
  };

  // Define the methods.
  KQuery.prototype = /** @lends Kinvey.Query# */ {
    // Comparison.

    /**
     * Adds an equal to filter to the query. Requires `field` to equal `value`.
     * Any existing filters on `field` will be discarded.
     * http://docs.mongodb.org/manual/reference/operators/#comparison
     *
     * @param {string} field Field.
     * @param {*}      value Value.
     * @returns {Kinvey.Query}
     */
    equalTo: function(field, value) {
      this.query[field] = value;
      return this;
    },

    /**
     * Adds a contains filter to the query. Requires `field` to contain at least
     * one of the members of `list`.
     * http://docs.mongodb.org/manual/reference/operator/in/
     *
     * @param {string} field  Field.
     * @param {Array}  values List of values.
     * @throws {Kinvey.Error} `values` must be of type: `Array`.
     * @returns {Kinvey.Query}
     */
    contains: function(field, values) {
      // Validate arguments.
      if(!isArray(values)) {
        throw new KError('values argument must be of type: Array.');
      }

      return this._add(field, '$in', values);
    },

    /**
     * Adds a contains all filter to the query. Requires `field` to contain all
     * members of `list`.
     * http://docs.mongodb.org/manual/reference/operator/all/
     *
     * @param {string} field  Field.
     * @param {Array}  values List of values.
     * @throws {Kinvey.Error} `values` must be of type: `Array`.
     * @returns {Kinvey.Query}
     */
    containsAll: function(field, values) {
      // Validate arguments.
      if(!isArray(values)) {
        throw new KError('values argument must be of type: Array.');
      }

      return this._add(field, '$all', values);
    },

    /**
     * Adds a greater than filter to the query. Requires `field` to be greater
     * than `value`.
     * http://docs.mongodb.org/manual/reference/operator/gt/
     *
     * @param {string}        field Field.
     * @param {number|string} value Value.
     * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
     * @returns {Kinvey.Query}
     */
    greaterThan: function(field, value) {
      // Validate arguments.
      if(!(isNumber(value) || isString(value))) {
        throw new KError('value argument must be of type: number or string.');
      }

      return this._add(field, '$gt', value);
    },

    /**
     * Adds a greater than or equal to filter to the query. Requires `field` to
     * be greater than or equal to `value`.
     * http://docs.mongodb.org/manual/reference/operator/gte/
     *
     * @param {string}        field Field.
     * @param {number|string} value Value.
     * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
     * @returns {Kinvey.Query}
     */
    greaterThanOrEqualTo: function(field, value) {
      // Validate arguments.
      if(!(isNumber(value) || isString(value))) {
        throw new KError('value argument must be of type: number or string.');
      }

      return this._add(field, '$gte', value);
    },

    /**
     * Adds a less than filter to the query. Requires `field` to be less than
     * `value`.
     * http://docs.mongodb.org/manual/reference/operator/lt/
     *
     * @param {string}        field Field.
     * @param {number|string} value Value.
     * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
     * @returns {Kinvey.Query}
     */
    lessThan: function(field, value) {
      // Validate arguments.
      if(!(isNumber(value) || isString(value))) {
        throw new KError('value argument must be of type: number or string.');
      }

      return this._add(field, '$lt', value);
    },

    /**
     * Adds a less than or equal to filter to the query. Requires `field` to be
     * less than or equal to `value`.
     * http://docs.mongodb.org/manual/reference/operator/lte/
     *
     * @param {string}        field Field.
     * @param {number|string} value Value.
     * @throws {Kinvey.Error} `value` must be of type: `number` or `string`.
     * @returns {Kinvey.Query}
     */
    lessThanOrEqualTo: function(field, value) {
      // Validate arguments.
      if(!(isNumber(value) || isString(value))) {
        throw new KError('value argument must be of type: number or string.');
      }

      return this._add(field, '$lte', value);
    },

    /**
     * Adds a not equal to filter to the query. Requires `field` not to equal
     * `value`.
     * http://docs.mongodb.org/manual/reference/operator/ne/
     *
     * @param {string} field Field.
     * @param {*}      value Value.
     * @returns {Kinvey.Query}
     */
    notEqualTo: function(field, value) {
      return this._add(field, '$ne', value);
    },

    /**
     * Adds a not contained in filter to the query. Requires `field` not to
     * contain any of the members of `list`.
     * http://docs.mongodb.org/manual/reference/operator/nin/
     *
     * @param {string} field  Field.
     * @param {Array}  values List of values.
     * @throws {Kinvey.Error} `values` must be of type: `Array`.
     * @returns {Kinvey.Query}
     */
    notContainedIn: function(field, values) {
      // Validate arguments.
      if(!isArray(values)) {
        throw new KError('values argument must be of type: Array.');
      }

      return this._add(field, '$nin', values);
    },

    // Logical. The operator precedence is defined as: AND-NOR-OR.

    /**
     * Performs a logical AND operation on the query and the provided queries.
     * http://docs.mongodb.org/manual/reference/operator/and/
     *
     * @param {...Kinvey.Query|Object} Queries.
     * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
     * @returns {Kinvey.Query}
     */
    and: function() {
      // AND has highest precedence. Therefore, even if this query is part of a
      // JOIN already, apply it on this query.
      return this._join('$and', nativeArraySlice.call(arguments));
    },

    /**
     * Performs a logical NOR operation on the query and the provided queries.
     * http://docs.mongodb.org/manual/reference/operator/nor/
     *
     * @param {...Kinvey.Query|Object} Queries.
     * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
     * @returns {Kinvey.Query}
     */
    nor: function() {
      // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
      // apply the NOR onto the parent to make sure AND indeed precedes NOR.
      if(null !== this._parent && !isNone(this._parent.query.$and)) {
        return this._parent.nor.apply(this._parent, arguments);
      }
      return this._join('$nor', nativeArraySlice.call(arguments));
    },

    /**
     * Performs a logical OR operation on the query and the provided queries.
     * http://docs.mongodb.org/manual/reference/operator/or/
     *
     * @param {...Kinvey.Query|Object} Queries.
     * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
     * @returns {Kinvey.Query}
     */
    or: function() {
      // OR has lowest precedence. Therefore, if this query is part of any join,
      // apply the OR onto the parent to make sure OR has indeed the lowest
      // precedence.
      if(null !== this._parent) {
        return this._parent.or.apply(this._parent, arguments);
      }
      return this._join('$or', nativeArraySlice.call(arguments));
    },

    // Element.

    /**
     * Adds an exists filter to the query. Requires `field` to exist if `flag` is
     * `true`, or not to exist if `flag` is `false`.
     * http://docs.mongodb.org/manual/reference/operator/exists/
     *
     * @param {string}   field      Field.
     * @param {boolean} [flag=true] The exists flag.
     * @returns {Kinvey.Query}
     */
    exists: function(field, flag) {
      flag = 'undefined' === typeof flag ? true : flag || false; // Cast.
      return this._add(field, '$exists', flag);
    },

    /**
     * Adds a modulus filter to the query. Requires `field` modulo `divisor` to
     * have remainder `remainder`.
     * http://docs.mongodb.org/manual/reference/operator/mod/
     *
     * @param {string}  field        Field.
     * @param {number}  divisor      Divisor.
     * @param {number} [remainder=0] Remainder.
     * @throws {Kinvey.Error} * `divisor` must be of type: `number`.
     *                        * `remainder` must be of type: `number`.
     * @returns {Kinvey.Query}
     */
    mod: function(field, divisor, remainder) {
      // Cast arguments.
      if(isString(divisor)) {
        divisor = parseFloat(divisor);
      }
      if(undefined === remainder) {
        remainder = 0;
      }
      else if(isString(remainder)) {
        remainder = parseFloat(remainder);
      }

      // Validate arguments.
      if(!isNumber(divisor)) {
        throw new KError('divisor arguments must be of type: number.');
      }
      if(!isNumber(remainder)) {
        throw new KError('remainder argument must be of type: number.');
      }

      return this._add(field, '$mod', [divisor, remainder]);
    },

    // JavaScript.

    /**
     * Adds a match filter to the query. Requires `field` to match `regExp`.
     * http://docs.mongodb.org/manual/reference/operator/regex/
     *
     * @param {string}        field  Field.
     * @param {RegExp|string} regExp Regular expression.
     * @param {Object}  [options] Options.
     * @param {boolean} [options.multiline=inherit] Toggles multiline matching.
     * @param {boolean} [options.extended=false] Toggles extended capability.
     * @param {boolean} [options.dotMatchesAll=false] Toggles dot matches all.
     * @throws {Kinvey.Error} * ignoreCase flag is not supported.
     * `regExp` must be an anchored expression.
     * @returns {Kinvey.Query}
     */
    matches: function(field, regExp, options) {
      // Cast arguments.
      if(!isRegExp(regExp)) {
        regExp = new RegExp(regExp);
      }
      options = options || {};

      // Validate arguments.
      if(regExp.ignoreCase) {
        throw new KError('ignoreCase flag is not supported.');
      }
      if(0 !== regExp.source.indexOf('^')) {
        throw new KError('regExp must be an anchored expression.');
      }

      // Flags.
      var flags = [];
      if((regExp.multiline || options.multiline) && false !== options.multiline) {
        flags.push('m');
      }
      if(options.extended) {
        flags.push('x');
      }
      if(options.dotMatchesAll) {
        flags.push('s');
      }

      // `$regex` and `$options` are separate filters.
      var result = this._add(field, '$regex', regExp.source);
      if(0 !== flags.length) {
        this._add(field, '$options', flags.join(''));
      }
      return result;
    },

    // Geospatial.

    /**
     * Adds a near filter to the query. Requires `field` to be a coordinate
     * within `maxDistance` of `coord`. Sorts documents from nearest to farthest.
     * http://docs.mongodb.org/manual/reference/operator/near/
     *
     * @param {string}                 field        The field.
     * @param {Array.<number, number>} coord        The coordinate (longitude, latitude).
     * @param {number}                [maxDistance] The maximum distance (miles).
     * @throws {Kinvey.Error} `coord` must be of type: `Array.<number, number>`.
     * @returns {Kinvey.Query}
     */
    near: function(field, coord, maxDistance) {
      // Validate arguments.
      if(!isArray(coord) || isNone(coord[0]) || isNone(coord[1])) {
        throw new KError('coord argument must be of type: Array.<number, number>.');
      }

      // Cast arguments.
      coord[0] = parseFloat(coord[0]);
      coord[1] = parseFloat(coord[1]);

      // `$nearSphere` and `$maxDistance` are separate filters.
      var result = this._add(field, '$nearSphere', [coord[0], coord[1]]);
      if(!isNone(maxDistance)) {
        this._add(field, '$maxDistance', maxDistance);
      }
      return result;
    },

    /**
     * Adds a within box filter to the query. Requires `field` to be a coordinate
     * within the bounds of the rectangle defined by `bottomLeftCoord`,
     * `bottomRightCoord`.
     * http://docs.mongodb.org/manual/reference/operator/box/
     *
     * @param {string}                 field           The field.
     * @param {Array.<number, number>} bottomLeftCoord The bottom left coordinate
     *         (longitude, latitude).
     * @param {Array.<number, number>} upperRightCoord The bottom right
     *         coordinate (longitude, latitude).
     * @throws {Kinvey.Error} * `bottomLeftCoord` must be of type: `Array.<number, number>`.
     *                        * `bottomRightCoord` must be of type: `Array.<number, number>`.
     * @returns {Kinvey.Query}
     */
    withinBox: function(field, bottomLeftCoord, upperRightCoord) {
      // Validate arguments.
      if(!isArray(bottomLeftCoord) || isNone(bottomLeftCoord[0]) || isNone(bottomLeftCoord[1])) {
        throw new KError('bottomLeftCoord argument must be of type: Array.<number, number>.');
      }
      if(!isArray(upperRightCoord) || isNone(upperRightCoord[0]) || isNone(upperRightCoord[1])) {
        throw new KError('upperRightCoord argument must be of type: Array.<number, number>.');
      }

      // Cast arguments.
      bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
      bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
      upperRightCoord[0] = parseFloat(upperRightCoord[0]);
      upperRightCoord[1] = parseFloat(upperRightCoord[1]);

      var coords = [
        [bottomLeftCoord[0], bottomLeftCoord[1]],
        [upperRightCoord[0], upperRightCoord[1]]
      ];
      return this._add(field, '$within', {
        $box: coords
      });
    },

    /**
     * Adds a within polygon filter to the query. Requires `field` to be a
     * coordinate within the bounds of the polygon defined by `coords`.
     * http://docs.mongodb.org/manual/reference/operator/polygon/
     *
     * @param {string}                       field  The field.
     * @param {Array.Array.<number, number>} coords List of coordinates.
     * @throws {Kinvey.Error} `coords` must be of type `Array.Array.<number, number>`.
     * @returns {Kinvey.Query}
     */
    withinPolygon: function(field, coords) {
      // Validate arguments.
      if(!isArray(coords) || 3 > coords.length) {
        throw new KError('coords argument must be of type: Array.Array.<number, number>.');
      }

      // Cast and validate arguments.
      coords = coords.map(function(coord) {
        if(isNone(coord[0]) || isNone(coord[1])) {
          throw new KError('coords argument must be of type: Array.Array.<number, number>.');
        }
        return [parseFloat(coord[0]), parseFloat(coord[1])];
      });

      return this._add(field, '$within', {
        $polygon: coords
      });
    },

    // Array.

    /**
     * Adds a size filter to the query. Requires `field` to be an `Array` with
     * exactly `size` members.
     * http://docs.mongodb.org/manual/reference/operator/size/
     *
     * @param {string} field Field.
     * @param {number} size  Size.
     * @throws {Kinvey.Error} `size` must be of type: `number`.
     * @returns {Kinvey.Query}
     */
    size: function(field, size) {
      // Cast arguments.
      if(isString(size)) {
        size = parseFloat(size);
      }

      // Validate arguments.
      if(!isNumber(size)) {
        throw new KError('size argument must be of type: number.');
      }

      return this._add(field, '$size', size);
    },

    // Modifiers.

    /**
     * Sets the fields to retrieve.
     *
     * @param {Array} fields
     * @throws {Kinvey.Error} `fields` must be of type: `Array`.
     * @returns {Kinvey.Query}
     */
    setFields: function(fields) {
      if(null === this._parent) {
        // Validate arguments.
        if(!isArray(fields)) {
          throw new KError('fields argument must be of type: Array.');
        }
        this.fields = fields;
      }
      else {
        this._parent.setFields(fields);
      }
      return this;
    },

    /**
     * Sets the number of documents to select.
     *
     * @param {integer} [limit] Limit.
     * @throws {Kinvey.Error} `limit` must be of type: `number`.
     * @returns {Kinvey.Query}
     */
    setLimit: function(limit) {
      if(null === this._parent) {
        // Cast arguments.
        limit = !isNone(limit) ? parseFloat(limit) : null;

        // Validate arguments.
        if(!isNone(limit) && !isNumber(limit)) {
          throw new KError('limit argument must be of type: number.');
        }
        this.limit = limit;
      }
      else {
        this._parent.setLimit(limit);
      }
      return this;
    },

    /**
     * Sets the number of documents to skip from the start.
     *
     * @param {integer} [skip] Skip.
     * @throws {Kinvey.Error} `skip` must be of type: `number`.
     * @returns {Kinvey.Query}
     */
    setSkip: function(skip) {
      if(null === this._parent) {
        // Cast arguments.
        skip = !isNone(skip) ? parseFloat(skip) : 0;

        // Validate.
        if(!isNone(skip) && !isNumber(skip)) {
          throw new KError('skip argument must be of type: number.');
        }
        this.skip = skip;
      }
      else {
        this._parent.setSkip(skip);
      }
      return this;
    },

    /**
     * Adds an ascending sort modifier on the specified field.
     *
     * @param {string} field
     * @returns {Kinvey.Query}
     */
    ascending: function(field) {
      if(null === this._parent) {
        this.sort[field] = 1;
      }
      else {
        this._parent.ascending(field);
      }
      return this;
    },

    /**
     * Adds an descending sort modifier on the specified field.
     *
     * @param {string} field
     * @returns {Kinvey.Query}
     */
    descending: function(field) {
      if(null === this._parent) {
        this.sort[field] = -1;
      }
      else {
        this._parent.descending(field);
      }
      return this;
    },

    /**
     * Returns the JSON representation of the query.
     *
     * @returns {Object}
     */
    toJSON: function() {
      // Always return the top-level JSON representation.
      if(null !== this._parent) {
        return this._parent.toJSON();
      }

      // Return the specified public properties.
      return {
        fields: this.fields,
        limit: this.limit,
        query: this.query,
        skip: this.skip,
        sort: this.sort
      };
    },

    /**
     * Adds a filter to the query.
     *
     * @private
     * @param {string} field     Field.
     * @param {string} condition Condition.
     * @param {*}      value     Value.
     * @returns {Kinvey.Query}
     */
    _add: function(field, condition, value) {
      // Initialize the field selector.
      if(!isObject(this.query[field])) {
        this.query[field] = {};
      }
      this.query[field][condition] = value;
      return this;
    },

    /**
     * Joins the current query with another query using an operator.
     *
     * @private
     * @param {string} operator Operator.
     * @param {Kinvey.Query[]|Object[]} queries Queries.
     * @throws {Kinvey.Error} `query` must be of type: `Kinvey.Query[]` or `Object[]`.
     * @returns {Kinvey.Query} The query.
     */
    _join: function(operator, queries) {
      // Cast, validate, and parse arguments. If `queries` are supplied, obtain
      // the `filter` for joining. The eventual return function will be the
      // current query.
      var result = this;
      queries = queries.map(function(query) {
        if(!(query instanceof KQuery)) {
          if(isObject(query)) { // Cast argument.
            query = new KQuery(query);
          }
          else {
            throw new KError('query argument must be of type: Kinvey.Query[] or Object[].');
          }
        }
        return query.toJSON().query;
      });

      // If there are no `queries` supplied, create a new (empty) `Kinvey.Query`.
      // This query is the right-hand side of the join expression, and will be
      // returned to allow for a fluent interface.
      if(0 === queries.length) {
        result = new KQuery();
        queries = [result.toJSON().query];
        result._parent = this; // Required for operator precedence and `toJSON`.
      }

      // Join operators operate on the top-level of `_filter`. Since the `toJSON`
      // magic requires `_filter` to be passed by reference, we cannot simply re-
      // assign `_filter`. Instead, empty it without losing the reference.
      var currentQuery = {};
      for(var member in this.query) {
        if(this.query.hasOwnProperty(member)) {
          currentQuery[member] = this.query[member];
          delete this.query[member];
        }
      }

      // `currentQuery` is the left-hand side query. Join with `queries`.
      this.query[operator] = [currentQuery].concat(queries);

      // Return the current query if there are `queries`, and the new (empty)
      // `Kinvey.Query` otherwise.
      return result;
    }
  };

  /**
   * Returns the composite of all specified objects.
   *
   * @param {?Object}   target Target object.
   * @param {...Object} source Source objects to merge.
   * @returns {Object}
   */
  var kExtend = function(target /*, source*/ ) {
    return nativeArraySlice.call(arguments, 1).reduce(function(target, source) {
      for(var prop in source) {
        if(source.hasOwnProperty(prop) && !target.hasOwnProperty(prop)) {
          target[prop] = source[prop];
        }
      }
      return target;
    }, target || {});
  };

  /**
   * Define the Kinvey serializer.
   *
   * @namespace
   * @extends {DS.RESTSerializer}
   */
  var KSerializer = KEmberDS.RESTSerializer.extend( /** @lends KSerializer */ {
    /**
     * The primary key field.
     *
     * @type {string}
     */
    primaryKey: '_id',

    /**
     * Extracts references from the list payload returned by the adapter.
     *
     * @param {DS.Store}     store       Store.
     * @param {Kinvey.Model} type        Type.
     * @param {Array}        payload     Payload.
     * @param {?string}      id          Document id.
     * @param {string}       requestType Ruquest type.
     * @returns {Object}
     */
    extractArray: function(store, type, payload, id, requestType) {
      // Normalize payload and extract references to the side.
      var _this = this;
      var result = payload.reduce(function(prev, current) {
        return _this.extractRefs(type, current, prev);
      }, {});

      // Ensure the type key is set.
      var key = type.typeKey;
      result[key] = result[key] || [];
      return this._super(store, type, result, id, requestType);
    },

    /**
     * Extracts a single reference from the specified payload. The reference is
     * added to target (by reference), and the reference id is returned.
     *
     * @param {Object} descriptor Descriptor.
     * @param {Object} payload    Payload.
     * @param {Object} target     Target.
     * @returns {string}
     */
    extractRef: function(descriptor, payload, target) {
      // Extract references from the record, and return the id.
      if(isObject(payload._obj)) {
        this.extractRefs(descriptor.type, payload._obj, target);
      }
      return payload._id;
    },

    /**
     * Extracts references from the specified payload. References are added to
     * `target`, and the payload reference is replaced by the reference id.
     *
     * @param {Kinvey.Model} type    Type.
     * @param {Object}       payload Payload.
     * @param {Object}       result  Result.
     * @returns {Object}
     */
    extractRefs: function(type, payload, target) {
      type.eachRelationship(function(name, descriptor) {
        // If field is an array, extract references from all elements.
        var value = payload[name];
        if(isNone(value)) {
          payload[name] = 'hasMany' === descriptor.kind ? [] : null;
        }
        else if(isArray(value)) { // `hasMany`.
          payload[name] = value.map(function(element) {
            return this.extractRef(descriptor, element, target);
          }, this);
        }
        else { // `belongsTo`.
          payload[name] = this.extractRef(descriptor, value, target);
        }
      }, this);

      // Add payload to target, and return.
      var key = type.typeKey;
      target[key] = target[key] || [];
      target[key].push(payload);
      return target;
    },

    /**
     * Extracts references from the object payload returned by the adapter.
     *
     * @param {DS.Store}     store       Store.
     * @param {Kinvey.Model} type        Type.
     * @param {Object}       payload     Payload.
     * @param {?string}      id          Document id.
     * @param {string}       requestType Ruquest type.
     * @returns {Object}
     */
    extractSingle: function(store, type, payload, id, requestType) {
      // Normalize payload and extract references to the side.
      var result = this.extractRefs(type, payload, {});
      return this._super(store, type, result, id, requestType);
    },

    /**
     * Normalizes a record returned by the adapter.
     *
     * @param {Kinvey.Model} type Type.
     * @param {Object}       hash Object hash.
     * @param {string}       prop Property.
     * @returns {Object}
     */
    normalize: function(type, hash, prop) {
      // Camelize user name attributes.
      if(kUserType === type.typeKey) {
        hash.firstName = hash.first_name;
        hash.lastName = hash.last_name;
        delete hash.first_name;
        delete hash.last_name;
      }

      // Extract ACL and KMD to top-level.
      hash.acl = hash._acl;
      if(isObject(hash._kmd)) {
        hash.createdAt = hash._kmd.ect;
        hash.lastModifiedAt = hash._kmd.lmt;

        // Extract authtoken, if set.
        if(kUserType === type.typeKey && !isNone(hash._kmd.authtoken)) {
          hash.authtoken = hash._kmd.authtoken;
        }

        // Extract e-mail verification, if set.
        if(kUserType === type.typeKey && !isNone(hash._kmd.emailVerification)) {
          hash.emailVerification = hash._kmd.emailVerification;
        }
        delete hash._kmd;
      }
      delete hash._acl;

      // Extract _geoloc. if set.
      if(!isNone(hash._geoloc)) {
        hash.geoloc = hash._geoloc;
        delete hash._geoloc;
      }

      // Return original.
      return this._super(type, hash, prop);
    },

    /**
     * Serializes a model for use by the adapter.
     *
     * @param {Kinvey.Model} record  Record.
     * @param {Object}       options Options.
     * @returns {Object}
     */
    serialize: function(record, options) {
      // Always embed the `_id` in the request body.
      options = kExtend(options, {
        includeId: true
      });
      var original = this._super(record, options);

      // Underscore user name attributes.
      if(record instanceof KUser) {
        original.first_name = original.firstName;
        original.last_name = original.lastName;
        delete original.firstName;
        delete original.lastName;
        delete original.authtoken; // Remove token.
        delete original.emailVerification; // Remove e-mail verification.
      }

      // Move ACL metadata.
      original._acl = original.acl;
      delete original.acl;

      // Move geoloc.
      if(!isNone(original.geoloc)) {
        original._geoloc = original.geoloc;
        delete original.geoloc;
      }

      // Strip KMD metadata from top-level.
      delete original.createdAt;
      delete original.lastModifiedAt;
      return original;
    },

    /**
     * Serializes a belongsTo relationship.
     *
     * @param {Kinvey.Model} record       Record.
     * @param {Object}       json         Hash.
     * @param {Object}       relationship Relationship.
     * @returns {Object}
     */
    serializeBelongsTo: function(record, json, relationship) {
      var prop = relationship.key;
      json[prop] = this.serializeRef(relationship.type, record.get(prop));
      return json;
    },

    /**
     * Serializes a hasMany relationship.
     *
     * @param {Kinvey.Model} record       Record.
     * @param {Object}       json         Hash.
     * @param {Object}       relationship Relationship.
     * @returns {Object}
     */
    serializeHasMany: function(record, json, relationship) {
      var prop = relationship.key;
      json[prop] = record.get(prop).map(function(record) {
        return this.serializeRef(relationship.type, record);
      }, this);
      return json;
    },

    /**
     * Modifies the payload for use by the adapter.
     * NOTE This changes the `hash` by reference.
     *
     * @param {Object}       hash    Object hash.
     * @param {Kinvey.Model} type    Type.
     * @param {Kinvey.Model} record  Record.
     * @param {Object}       options Options.
     */
    serializeIntoHash: function(hash, type, record, options) {
      kExtend(hash, this.serialize(record, options));
    },

    /**
     * Serializes a reference into a KinveyRef object.
     *
     * @param {Object} relationship Relationship.
     * @param {string} id           Document id.
     * @returns {Object}
     */
    serializeRef: function(type, record) {
      // If the record has no id, skip.
      var id = KEmber.get(record, 'id');
      if(isNone(id)) {
        return null;
      }

      // Return the KinveyRef.
      var collection = type.typeKey.pluralize().toLowerCase();
      return {
        _type: 'KinveyRef',
        _collection: collection,
        _id: id
      };
    }
  });

  /**
   * Base64 encodes the specified value.
   *
   * @param {string} value
   * @returns {string}
   */
  var base64Encode = root.btoa;

  /* globals angular: true, Backbone: true, DS: true, Ember: true, forge: true, jQuery: true */
  /* globals ko: true, Titanium: true, Zepto: true */

  // Device information.
  // -------------------

  // Build the device information string sent along with every network request.
  // <js-library>/<version> [(<library>/<version>,...)] <platform> <version> <manufacturer> <id>
  var kDeviceInformation = (function() {
    // Init.
    var browser;
    var id;
    var libraries = [];
    var manufacturer;
    var platform;
    var version;

    // Helper function to detect the browser name and version.
    var browserDetect = function(ua) {
      ua = ua.toLowerCase(); // Cast.

      // User Agent patterns.
      var rChrome = /(chrome)\/([\w]+)/;
      var rFirefox = /(firefox)\/([\w.]+)/;
      var rIE = /(msie) ([\w.]+)/i;
      var rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
      var rSafari = /(safari)\/([\w.]+)/;

      return rChrome.exec(ua) || rFirefox.exec(ua) || rIE.exec(ua) ||
        rOpera.exec(ua) || rSafari.exec(ua) || [];
    };

    // PhoneGap.
    if('undefined' !== typeof root.cordova && undefined !== root.device) {
      var device = root.device;
      libraries.push('phonegap/' + device.cordova);
      platform = device.platform;
      version = device.version;
      manufacturer = device.model;
      id = device.uuid;
    }

    // Titanium.
    else if('undefined' !== typeof Titanium) {
      libraries.push('titanium/' + Titanium.getVersion());

      // If mobileweb, extract browser information.
      if('mobileweb' === Titanium.Platform.getName()) {
        browser = browserDetect(Titanium.Platform.getModel());
        platform = browser[1];
        version = browser[2];
        manufacturer = Titanium.Platform.getOstype();
      }
      else {
        platform = Titanium.Platform.getOsname();
        version = Titanium.Platform.getVersion();
        manufacturer = Titanium.Platform.getManufacturer();
      }
      id = Titanium.Platform.getId();
    }

    // Trigger.io.
    else if('undefined' !== typeof forge) {
      libraries.push('triggerio/' + (forge.config.platform_version || ''));
      id = forge.config.uuid;
    }

    // Node.js.
    else if('undefined' !== typeof process) {
      platform = process.title;
      version = process.version;
      manufacturer = process.platform;
    }

    // Libraries.
    if('undefined' !== typeof angular) { // AngularJS.
      libraries.push('angularjs/' + angular.version.full);
    }
    if('undefined' !== typeof Backbone) { // Backbone.js.
      libraries.push('backbonejs/' + Backbone.VERSION);
    }
    if('undefined' !== typeof DS) { // Ember Data.
      libraries.push('ember-data/' + DS.VERSION);
    }
    if('undefined' !== typeof Ember) { // Ember.js.
      libraries.push('emberjs/' + Ember.VERSION);
    }
    if('undefined' !== typeof jQuery) { // jQuery.
      libraries.push('jquery/' + jQuery.fn.jquery);
    }
    if('undefined' !== typeof ko) { // Knockout.
      libraries.push('knockout/' + ko.version);
    }
    if('undefined' !== typeof Zepto) { // Zepto.js
      libraries.push('zeptojs');
    }

    // Default platform, most likely this is a web app.
    if(undefined === platform && root.navigator) {
      browser = browserDetect(root.navigator.userAgent);
      platform = browser[1];
      version = browser[2];
      manufacturer = root.navigator.platform;
    }

    // Compose the device information string.
    var prefix = 'js-ember/2.0.0-beta';
    if(0 !== libraries.length) { // Add library information.
      prefix += ' (' + libraries.sort().join(', ') + ')';
    }
    return [platform, version, manufacturer, id].reduce(function(prev, current) {
      current = current || 'unknown'; // Cast.
      return prev + ' ' + current.toString().replace(/\s/g, '_').toLowerCase();
    }, prefix);
  }());

  // List of error which, if returned from Kinvey, should mark the Ember model as
  // invalid.
  var kInvalidRequestErrors = [
    KError.USER_ALREADY_EXISTS,
    KError.USER_UNAVAILABLE,
    KError.INPUT_VALIDATION_FAILED,
    KError.USER_LOCKED_DOWN
  ];

  /**
   * Define the Kinvey HTTP mixin.
   *
   * @mixin
   * @extends {Ember.Mixin}
   */
  var KHttpMixin = KEmber.Mixin.create( /** @lends KHttpMixin */ {
    /**
     * The default adapter serializer.
     *
     * @type {string}
     */
    defaultSerializer: 'kinvey',

    /**
     * Default request headers.
     *
     * @type {Object}
     */
    headers: function() {
      // Basic headers.
      var headers = {
        Accept: 'application/json; charset=utf-8',
        'X-Kinvey-API-Version': Kinvey.API_VERSION,
        'X-Kinvey-Device-Information': kDeviceInformation
      };

      // Authorization.
      var token = this.get('activeUser.authtoken');
      if(!isNone(token)) { // Session Auth.
        kExtend(headers, {
          Authorization: 'Kinvey ' + token
        });
      }
      else if(!isNone(Kinvey.masterSecret) || !isNone(Kinvey.appSecret)) { // Basic auth.
        var secret = Kinvey.masterSecret || Kinvey.appSecret;
        kExtend(headers, {
          Authorization: 'Basic ' + base64Encode(Kinvey.appKey + ':' + secret)
        });
      }

      // Return headers.
      return headers;
    }.property('activeUser.authtoken', 'Kinvey.appKey', 'Kinvey.appSecret', 'Kinvey.masterSecret'),

    /**
     * Domain.
     *
     * @type {Ember.Binding}
     */
    hostBinding: KEmber.Binding.oneWay('Kinvey.domain'),

    /**
     * Request timeout.
     *
     * @type {integer}
     */
    timeout: 10000, // 10s.

    /**
     * Returns the relevant error from an ajax response.
     *
     * @param {Object} jqXHR `jQuery.ajax` object.
     * @returns {Object}
     */
    ajaxError: function(jqXHR) {
      // Invoke original.
      var error = this._super(jqXHR);

      // Extract error object.
      var response = error.responseJSON;
      if(!isNone(response)) {
        // Rename `error` property to `name`.
        if(!isNone(response.error)) {
          response.name = response.error;
          delete response.error;

          // Throw a `InvalidError` if the request was invalid.
          if(-1 !== kInvalidRequestErrors.indexOf(response.name)) {
            return new KEmberDS.InvalidError(response);
          }
        }

        // Another Kinvey error.
        return response;
      }

      // Return a request error.
      return kClientError(KError.REQUEST_ERROR, {
        debug: error
      });
    },

    /**
     * Returns the request options.
     *
     * @param {string} url  URL.
     * @param {string} type Request method.
     * @param {Object} hash Option hash.
     */
    ajaxOptions: function(url, type, hash) {
      // Set the timeout and return the original.
      hash = kExtend(hash, {
        timeout: this.get('timeout')
      });
      return this._super(url, type, hash);
    }
  });

  // No Operation.
  var noop = function() {
    return null;
  };

  /**
   * URL encodes the specified value.
   *
   * @param {string} value
   * @returns {string}
   */
  var urlEncode = root.encodeURIComponent;

  /**
   * The Kinvey REST adapter.
   *
   * @memberof! <global>
   * @namespace Kinvey.RESTAdapter
   * @extends {DS.RESTAdapter}
   */
  var KRESTAdapter = Kinvey.RESTAdapter = KEmberDS.RESTAdapter.extend(
    KHttpMixin,
    /** @lends Kinvey.RESTAdapter# */
    {
      /**
       * Returns the request options.
       *
       * @param {string} url  URL.
       * @param {string} type Request method.
       * @param {Object} hash Option hash.
       */
      ajaxOptions: function(url, type, hash) {
        // Add fields to resolve to data option.
        hash = hash || {}; // Cast.
        if(!isEmpty(hash.resolve)) {
          hash.data = hash.data || {};
          hash.data.resolve = hash.resolve.join(',');
        }
        return this._super(url, type, hash);
      },

      /**
       * Returns the URL for the specified type and id.
       *
       * @param {?string} type Type.
       * @param {?id}     id   Id.
       * @returns {string}
       */
      buildURL: function(type, id) {
        type = !isNone(type) ? urlEncode(type) : null;
        id = !isNone(id) ? urlEncode(id) : null;
        return this._super(type, id);
      },

      /**
       * Deletes the specified model.
       *
       * @param {DS.Store}     store  Store.
       * @param {Kinvey.Model} type   Type.
       * @param {Kinvey.Model} record Instance.
       * @returns {Promise}
       */
      deleteRecord: function(store, type, record) {
        // Return the original, and strip the return value.
        return this._super(store, type, record).then(noop);
      },

      /**
       * Retrieves a model.
       *
       * @param {DS.Store}     store Store.
       * @param {Kinvey.Model} type  Type.
       * @param {string}       id    Model id.
       * @returns {Promise}
       */
      find: function(store, type, id) {
        // Send the request.
        return this.ajax(this.buildURL(type.typeKey, id), 'GET', {
          resolve: this.resolve(type)
        });
      },

      /**
       * Retrieves all models (since `sinceToken`, if specified).
       *
       * @param {DS.Store}     store      Store.
       * @param {Kinvey.Model} type       Type.
       * @param {Date}         sinceToken Model freshness threshold.
       * @returns {Promise}
       */
      findAll: function(store, type, sinceToken) {
        // Generate query.
        var query;
        if(!isNone(sinceToken)) {
          query = new KQuery().greaterThan('_kmd.lmt', sinceToken);
        }

        // Forward to `findQuery`.
        return this.findQuery(store, type, query);
      },

      /**
       * Retrieves the documents matching the specified ids.
       *
       * @param {DS.Store}     store Store.
       * @param {Kinvey.Model} type  Type.
       * @param {Array}        ids   List of ids.
       * @returns {Promise}
       */
      findMany: function(store, type, ids) {
        // Generate query.
        var query = new KQuery().contains('_id', ids);

        // Forward to `findQuery`.
        return this.findQuery(store, type, query);
      },

      /**
       * Retrieves all documents matching the specified query.
       *
       * @param {DS.Store}     store Store.
       * @param {Kinvey.Model} type  Type.
       * @param {Kinvey.Query} query Query.
       * @returns {Promise}
       */
      findQuery: function(store, type, query) {
        var data = {}; // Init.

        // Generate query.
        if(!isNone(query)) {
          // Only add modifiers that are actually set.
          if(!isEmpty(query.fields)) {
            data.fields = query.fields.join(',');
          }
          if(!isNone(query.limit)) {
            data.limit = query.limit;
          }
          if(0 !== query.skip) {
            data.skip = query.skip;
          }
          if(!isEmpty(query.query)) {
            data.query = JSON.stringify(query.query);
          }
          if(!isEmpty(query.sort)) {
            data.sort = JSON.stringify(query.sort);
          }
        }

        // Send the request.
        return this.ajax(this.buildURL(type.typeKey), 'GET', {
          data: data,
          resolve: this.resolve(type)
        });
      },

      /**
       * Returns the URL path.
       *
       * @param {string} type Type.
       * @returns {string}
       */
      pathForType: function(type) {
        type = this._super(type);
        return [DATASTORE, Kinvey.appKey, type].join('/');
      },

      /**
       * Returns the query string for resolving fields for the specified type.
       *
       * @param {Kinvey.Model} type              Type.
       * @param {string}       [prefix]          Field prefix.
       * @param {Array}        [alreadyIncluded] Types already included.
       * @returns {string}
       */
      resolve: function(type, prefix, alreadyIncluded) {
        var result = []; // Init.

        // Infinite loop check.
        alreadyIncluded = alreadyIncluded || [];
        if(-1 !== alreadyIncluded.indexOf(type)) {
          return result;
        }
        alreadyIncluded.push(type);

        // Resolve each relationship.
        type.eachRelationship(function(field, descriptor) {
          // Iterate through children and merge result.
          var path = (!isNone(prefix) ? prefix + '.' : '') + field;
          var resolve = this.resolve(descriptor.type, path, alreadyIncluded);
          result.push.apply(result, isEmpty(resolve) ? [path] : resolve);
        }, this);

        // Return the result.
        return result;
      }
    }
  );

  /**
   * Imports a method from the Kinvey REST adapter.
   *
   * @param {string} method Method name.
   * @returns {function}
   */
  var kMixinMethod = function(method) {
    return function() {
      var adapter = Kinvey.__container__.lookup('adapter:kinvey');
      return adapter[method].apply(this, arguments);
    };
  };

  /**
   * The Kinvey RPC adapter.
   *
   * @namespace
   * @extends {DS.Adapter}
   */
  var KRpcAdapter = KEmberDS.Adapter.extend({
    // The RPC adapter does not extend the REST adapter, yet a few helper methods
    // are useful for RPC purposes.
    ajax: kMixinMethod('ajax'),
    ajaxError: kMixinMethod('ajaxError'),
    ajaxOptions: kMixinMethod('ajaxOptions'),
    buildURL: kMixinMethod('buildURL'),
    urlPrefix: kMixinMethod('urlPrefix')
  }, KHttpMixin, /** @lends KRpcAdapter# */ {
    /**
     * Returns the URL path.
     *
     * @param {string} type Type.
     * @returns {string}
     */
    pathForType: function(type) {
      return [RPC, Kinvey.appKey, type].join('/');
    }
  });

  // The User namespace.
  var USER = 'user';

  // Active User.
  // ------------

  // The library has the concept of an active user, which represents the user
  // using the app. There can only be one active user.

  // The key under which the active user is stored.
  var kActiveUserInjectionName = 'user:active';

  /**
   * Returns the active user storage key.
   *
   * @returns {string}
   */
  var kActiveUserKey = function() {
    return Kinvey.appKey + '.activeUser';
  };

  /**
   * Returns the active user.
   *
   * @returns {?Kinvey.User} The active user, or `null` if not set.
   */
  var kGetActiveUser = Kinvey.getActiveUser = function() {
    return Kinvey.__container__.lookup(kActiveUserInjectionName).get('content');
  };

  /**
   * Sets the active user.
   *
   * @param {?Kinvey.User} user User instance.
   * @returns {?Kinvey.User} The previous active user, or `null` if not set.
   */
  var kSetActiveUser = Kinvey.setActiveUser = function(user) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Setting the active user.', user);
    }

    // Validate arguments.
    if(!isNone(user) && !(!isNone(user.get('id')) && !isNone(user.get('authtoken')))) {
      throw new KError('user argument must contain: id and authtoken.');
    }

    // Obtain a reference to the to-be-replaced active user.
    var proxy = Kinvey.__container__.lookup(kActiveUserInjectionName);
    var previous = proxy.get('content'); // Previous.
    proxy.set('content', user);

    // Update application state.
    var key = kActiveUserKey();
    if(isNone(user)) {
      KStorage.destroy(key);
    }
    else {
      KStorage.save(key, [user.get('id'), user.get('authtoken')]);
    }

    // Reset the authtoken and return the previous active user.
    if(!isNone(previous) && user !== previous) {
      // Update `authtoken` at the soonest occasion.
      previous.adapterDidUpdateAttribute('authtoken', null);
    }
    return previous;
  };

  /**
   * Registers the active user for the specified application.
   *
   * @param {Ember.Application} application Application.
   * @returns {boolean} `true` if there was an active user, false otherwise.
   */
  var kRegisterActiveUser = function(application) {
    // Register the active user and inject.
    if(!Kinvey.__container__.has(kActiveUserInjectionName)) {
      application.register(kActiveUserInjectionName, KEmber.ObjectProxy, {
        singleton: true
      });
      application.inject('adapter', 'activeUser', kActiveUserInjectionName);
    }

    // Attempt to resurrect the active user.
    var key = kActiveUserKey();
    var value = KStorage.get(key);
    if(null !== value) { // Instantiate user.
      var store = Kinvey.__container__.lookup('store:main');
      value = store.push(kUserType, {
        id: value[0],
        authtoken: value[1]
      }, true);
    }

    // Set the active user, and return.
    kSetActiveUser(value);
    return null !== value;
  };

  /**
   * The Kinvey user adapter.
   *
   * @memberof! <global>
   * @namespace Kinvey.UserAdapter
   * @extends {Kinvey.RESTAdapter}
   */
  var KUserAdapter = Kinvey.UserAdapter = KRESTAdapter.extend( /** @lends Kinvey.UserAdapter# */ {
    /**
     * Returns the request options.
     * TODO Make this configurable.
     *
     * @param {string} url  URL.
     * @param {string} type Request method.
     * @param {Object} hash Option hash.
     */
    ajaxOptions: function(url, type, hash) {
      // By default, hard delete the user.
      if('DELETE' === type) {
        url += '?hard=true';
      }

      // Return the original.
      return this._super(url, type, hash);
    },

    /**
     * Creates a new user.
     *
     * @param {DS.Store}    store  Store.
     * @param {Kinvey.User} type   Type.
     * @param {Kinvey.User} record Instance.
     * @returns {Promise}
     */
    createRecord: function(store, type, record) {
      // Unset the `id`.
      record.set('id', null);

      // Invoke the original.
      return this._super(store, type, record);
    },

    /**
     * Deletes the specified user.
     *
     * @param {DS.Store}    store  Store.
     * @param {Kinvey.User} type   Type.
     * @param {Kinvey.User} record Instance.
     * @returns {Promise}
     */
    deleteRecord: function(store, type, record) {
      // Validate preconditions.
      if(kGetActiveUser() !== record) {
        var reason = kClientError(KError.NOT_LOGGED_IN);
        return KPromise.reject(reason);
      }

      // Return the response.
      return this._super(store, type, record).then(function(value) {
        // Reset the active user if the deleted user was the active user.
        if(kGetActiveUser() === record) {
          kSetActiveUser(null);
        }
        return value;
      });
    },

    /**
     * Logs in an existing user given username and password.
     *
     * @param {DS.Store}       store          Store.
     * @param {Kinvey.User}    type           Type.
     * @param {Object|string}  usernameOrData Username, or data.
     * @param {string}        [password]      Password.
     * @throws {Kinvey.Error} `usernameOrData` must contain: `username` and
     *          `password`, or `_socialIdentity`.
     * @returns {Promise}
     */
    login: function(store, type, usernameOrData, password) {
      // Cast arguments.
      if(!isObject(usernameOrData)) {
        usernameOrData = {
          username: usernameOrData,
          password: password
        };
      }

      // Validate arguments.
      if(isNone(usernameOrData.username) && isNone(usernameOrData.password) &&
        isNone(usernameOrData._socialIdentity)) {
        throw new KError('usernameOrData argument must contain: username and ' +
          'password, or _socialIdentity.');
      }

      // Validate preconditions.
      if(null !== kGetActiveUser()) {
        var reason = kClientError(KError.ALREADY_LOGGED_IN);
        return KPromise.reject(reason);
      }

      // Return the response.
      return this.ajax(this.buildURL(type.typeKey, 'login'), 'POST', {
        data: usernameOrData
      }).then(function(response) {
        // Push user into store.
        var serializer = store.serializerFor(type.typeKey);
        var payload = serializer.extractSingle(store, type, response, response._id, 'login');
        var user = store.push(type.typeKey, payload);

        // Set the active user and return.
        kSetActiveUser(user);
        return user;
      });
    },

    /**
     * Logs out the active user.
     *
     * @param {DS.Store}    store Store.
     * @param {Kinvey.User} type  Type.
     * @param {Kinvey.User} user  User instance.
     * @returns {Promise}
     */
    logout: function(store, type, user) {
      // Validate preconditions.
      if(kGetActiveUser() !== user) {
        var reason = kClientError(KError.NOT_LOGGED_IN);
        return KPromise.reject(reason);
      }

      // Return the response.
      return this.ajax(this.buildURL(type.typeKey, '_logout'), 'POST').then(function() {
        // Reset the active user, and return the previous active user.
        return kSetActiveUser(null);
      });
    },

    /**
     * Returns the URL path.
     *
     * @param {string} type Type.
     * @returns {string}
     */
    pathForType: function( /*type*/ ) {
      var path = [USER, Kinvey.appKey];
      return path.join('/');
    }
  });

  // The user type.
  var kUserType = USER;

  /**
   * Initializes the library.
   *
   * @param {Ember.Container}   container   Container.
   * @param {Ember.Application} application Application.
   * @param {Object}   options
   * @param {string}   options.appKey        App Key.
   * @param {string}  [options.appSecret]    App Secret.
   * @param {boolean} [options.debug=false]  Enable debug mode.
   * @param {string}  [options.domain]       Endpoint.
   * @param {string}  [options.masterSecret] Master Secret. ** Never use the
   *         Master Secret in client-side code.**
   * @param {string}  [options.userType]     User type.
   * @throws {Kinvey.Error} * `options` must contain: `appKey`.
   *                        * `options` must contain: `appSecret` and/or `masterSecret`.
   */
  Kinvey.init = function(container, application, options) {
    // Cast arguments.
    options = options || {};

    // Set debug mode.
    root.KINVEY_DEBUG = options.debug || false;

    // Debug.
    if(KINVEY_DEBUG) {
      log('Initializing the library.', options);
    }

    // Validate arguments.
    if(isNone(options.appKey)) {
      throw new KError('options argument must contain: appKey.');
    }
    if(isNone(options.appSecret) && isNone(options.masterSecret)) {
      throw new KError('options argument must contain: appSecret and/or masterSecret.');
    }

    // Save a reference to the container.
    Kinvey.__container__ = container;

    // Set properties.
    Kinvey.appKey = options.appKey;
    Kinvey.appSecret = options.appSecret || null;
    Kinvey.masterSecret = options.masterSecret || null;
    Kinvey.domain = options.domain || Kinvey.API_ENDPOINT;
    kUserType = options.userType || USER;

    // Register components.
    application.register('adapter:kinvey', KRESTAdapter);
    application.register('adapter:rpc', KRpcAdapter);
    application.register('adapter:' + kUserType, KUserAdapter);
    application.register('serializer:kinvey', KSerializer);
    application.register('transform:acl', KAclTransform);

    // Register the active user.
    return kRegisterActiveUser(application);
  };

  /**
   * Pings the Kinvey service.
   *
   * @returns {Promise}
   */
  Kinvey.ping = function() {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Pinging the Kinvey service.');
    }

    // Validate preconditions.
    if(isNone(Kinvey.appKey)) {
      // Prepare.
      var reason = kClientError(KError.MISSING_APP_CREDENTIALS);

      // Debug.
      if(KINVEY_DEBUG) {
        log('Failed to ping the Kinvey service.', reason);
      }

      // Return the response.
      return KPromise.reject(reason);
    }

    // Prepare.
    var adapter = Kinvey.__container__.lookup('adapter:kinvey');
    var promise = adapter.ajax(adapter.buildURL());

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(value) {
        log('Pinged the Kinvey service.', value);
      }, function(reason) {
        log('Failed to ping the Kinvey service.', reason);
      });
    }

    // Return the response.
    return promise;
  };

  // The RPC namespace.
  var RPC = 'rpc';

  // Custom Endpoints.
  // -----------------

  /**
   * Invokes a custom endpoint.
   *
   * @param {string}  id    The endpoint.
   * @param {*}      [args] Arguments.
   * @returns {Promise}
   */
  Kinvey.execute = function(id, args) {
    // Debug.
    if(KINVEY_DEBUG) {
      log('Invoking a custom endpoint.', id, args);
    }

    // Prepare.
    var adapter = Kinvey.__container__.lookup('adapter:rpc');
    var promise = adapter.ajax(adapter.buildURL('custom', id), 'POST', {
      data: args
    }).
      catch(function(reason) {
        // If `REQUEST_ERROR  the debug object may hold a customized response.
        if(KError.REQUEST_ERROR === reason.name && !isEmpty(reason.debug)) {
          reason = reason.debug;
        }
        return KPromise.reject(reason);
      });

    // Debug.
    if(KINVEY_DEBUG) {
      promise.then(function(value) {
        log('Invoked the custom endpoint.', value);
      }, function(reason) {
        log('Failed to invoke the custom endpoint.', reason);
      });
    }

    // Return the response.
    return promise;
  };

  // Users.
  // ------

  /**
   * Define the Kinvey user model.
   *
   * @memberof! <global>
   * @namespace Kinvey.User
   * @extends {Kinvey.Model}
   */
  var KUser = Kinvey.User = KModel.extend( /** @lends Kinvey.User# */ {
    /**
     * The authtoken associated with this user.
     *
     * @default
     * @type {?string}
     */
    authtoken: KEmberDS.attr('string'),

    /**
     * Username.
     *
     * @type {string}
     */
    username: KEmberDS.attr('string'),

    /**
     * Password.
     *
     * @type {string}
     */
    password: KEmberDS.attr('string'),

    /**
     * E-mail address.
     *
     * @type {?string}
     */
    email: KEmberDS.attr('string'),

    /**
     * E-mail verification status.
     *
     * @type {Object}
     */
    emailVerification: KEmberDS.attr(),

    /**
     * First name.
     *
     * @type {?string}
     */
    firstName: KEmberDS.attr('string'),

    /**
     * Last name.
     *
     * @type {?string}
     */
    lastName: KEmberDS.attr('string'),

    /**
     * Computed full name.
     *
     * @type {string}
     */
    fullName: function() {
      var firstName = this.get('firstName');
      var lastName = this.get('lastName');
      if(isNone(firstName)) {
        return lastName;
      }
      if(isNone(lastName)) {
        return firstName;
      }
      return firstName + ' ' + lastName;
    }.property('firstName', 'lastName'),

    /**
     * Computed flag indicating whether the user is logged in.
     *
     * @type {boolean}
     */
    isLoggedIn: function() {
      return null !== this.get('authtoken');
    }.property('authtoken'),

    /**
     * Logs out the user.
     *
     * @param {Object}  [options]             Options.
     * @param {boolean} [options.force=false] Reset the active user even if an
     *         `INVALID_CREDENTIALS` error was returned.
     * @returns {Promise}
     */
    logout: function(options) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Logging out the active user.', options);
      }

      // Cast arguments.
      options = kExtend(options, {
        force: false
      });

      // Forward to the user adapter.
      var model = this.store.modelFor(kUserType);
      var adapter = this.store.adapterFor(model);
      var promise = adapter.logout(this.store, model, this).
        catch(function(reason) {
          if(options.force && KError.INVALID_CREDENTIALS === reason.name) {
            // Debug.
            if(KINVEY_DEBUG) {
              log('The user credentials are invalid. Returning success because of the force flag.');
            }

            // Reset the active user, and return the previous active user.
            return kSetActiveUser(null);
          }
          return KPromise.reject(reason);
        });

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Logged out the active user.', value);
        }, function(reason) {
          log('Failed to logout the active user.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Sets data on the model.
     *
     * @param {Object}  data     Data.
     * @param {boolean} _partial Whether to merge or overwrite data.
     */
    setupData: function(data, _partial) {
      // Preserve authtoken.
      if(this.get('isLoggedIn') && null === data.authtoken) {
        data.authtoken = this.get('authtoken');
      }
      return this._super(data, _partial); // Invoke original.
    }
  });

  /**
   * Define static methods for users.
   *
   */
  KUser.reopenClass( /** @lends Kinvey.User */ {
    /**
     * Checks whether a username exists.
     *
     * @param {string} username Username.
     * @returns {Promise}
     */
    exists: function(username) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Checking whether a username exists.', username);
      }

      // Forward to the adapter.
      var adapter = Kinvey.__container__.lookup('adapter:rpc');
      var promise = adapter.ajax(adapter.buildURL('check-username-exists'), 'POST', {
        data: {
          username: username
        }
      }).then(function(response) {
        return response.usernameExists;
      });

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Checked whether the username exists.', value);
        }, function(reason) {
          log('Failed to check whether the username exists.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Requests a username reminder for a user.
     *
     * @param {string} email E-mail.
     * @returns {Promise}
     */
    forgotUsername: function(email) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Requesting a username reminder.', email);
      }

      // Forward to the adapter.
      var adapter = Kinvey.__container__.lookup('adapter:rpc');
      var promise = adapter.ajax(adapter.buildURL('user-forgot-username'), 'POST', {
        data: {
          email: email
        }
      }).then(noop);

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Requested a username reminder.', value);
        }, function(reason) {
          log('Failed to request a username reminder.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Logs in a user.
     *
     * @param {Object|string}  usernameOrData Username, or data.
     * @param {string}        [password]      Password.
     * @returns {Promise}
     */
    login: function(usernameOrData, password) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Logging in an existing user.', usernameOrData, password);
      }

      // Forward to the adapter.
      var store = Kinvey.__container__.lookup('store:main');
      var model = store.modelFor(kUserType);
      var adapter = store.adapterFor(model);
      var promise = adapter.login(store, model, usernameOrData, password);

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Logged in the user.', value);
        }, function(reason) {
          log('Failed to login the user.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Requests a password reset for a user.
     *
     * @param {string} username Username.
     * @returns {Promie}
     */
    resetPassword: function(username) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Requesting a password reset.', username);
      }

      // Forward to the adapter.
      var adapter = Kinvey.__container__.lookup('adapter:rpc');
      var promise = adapter.ajax(
        adapter.buildURL(username, 'user-password-reset-initiate'),
        'POST'
      ).then(noop);

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Requested a password reset.', value);
        }, function(reason) {
          log('Failed to request a password reset.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Restores a previously disabled user.
     *
     * @param {string} id User id.
     * @returns {Promise}
     */
    restore: function(id) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Restoring a previously disabled user.', id);
      }

      // Forward to the adapter.
      var adapter = Kinvey.__container__.lookup('adapter:' + kUserType);
      var promise = adapter.ajax(adapter.buildURL(id, '_restore'), 'POST');

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Restored the previously disabled user.', value);
        }, function(reason) {
          log('Failed to restore the previously disabled user.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Creates a new user.
     *
     * @param {Object} data Data.
     * @returns {Promise}
     */
    signup: function(data) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Signing up a new user.', data);
      }

      // Validate preconditions.
      if(null !== kGetActiveUser()) {
        // Prepare.
        var reason = kClientError(KError.ALREADY_LOGGED_IN);

        // Debug.
        if(KINVEY_DEBUG) {
          log('Failed to sign up a new user.', reason);
        }

        // Return the response.
        return KPromise.reject(reason);
      }

      // Forward to the adapter.
      var store = Kinvey.__container__.lookup('store:main');
      var user = store.createRecord(kUserType, data);
      var promise = user.save().then(function(user) {
        kSetActiveUser(user);
        return user;
      });

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Signed up a new user.', value);
        }, function(reason) {
          log('Failed to sign up a new user.', reason);
        });
      }

      // Return the response.
      return promise;
    },

    /**
     * Requests e-mail verification for a user.
     *
     * @param {string} username Username.
     * @returns {Promise}
     */
    verifyEmail: function(username) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Requesting e-mail verification.', username);
      }

      // Forward to the adapter.
      var adapter = Kinvey.__container__.lookup('adapter:rpc');
      var promise = adapter.ajax(
        adapter.buildURL(username, 'user-email-verification-initiate'),
        'POST'
      ).then(noop);

      // Debug.
      if(KINVEY_DEBUG) {
        promise.then(function(value) {
          log('Requested e-mail verification.', value);
        }, function(reason) {
          log('Failed to request e-mail verification.', reason);
        });
      }

      // Return the response.
      return promise;
    }
  });

}.call(this));