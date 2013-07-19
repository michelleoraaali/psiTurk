// Generated by CoffeeScript 1.6.3
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["backbone", 'text!templates/aws-info.html', 'text!templates/overview.html', 'text!templates/hit-config.html', 'text!templates/database.html', 'text!templates/server-params.html', 'text!templates/expt-info.html', 'views/validators', 'views/HITView', 'models/HITModel', 'collections/HITCollection', 'views/RunExptView'], function(Backbone, AWSInfoTemplate, OverviewTemplate, HITConfigTemplate, DatabaseTemplate, ServerParamsTemplate, ExptInfoTemplate, Validators, HITView, HIT, HITs, RunExptView) {
    var SideBarView, _ref;
    return SideBarView = (function(_super) {
      __extends(SideBarView, _super);

      function SideBarView() {
        this.render = __bind(this.render, this);
        this.loadOverview = __bind(this.loadOverview, this);
        this.captureUIEvents = __bind(this.captureUIEvents, this);
        _ref = SideBarView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SideBarView.prototype.verifyAWSLogin = function() {
        var _this = this;
        return $.when(this.options.config.fetch().then(function() {
          var inputData, key_id, secret_key;
          key_id = _this.options.config.get("AWS Access").aws_access_key_id;
          secret_key = _this.options.config.get("AWS Access").aws_secret_access_key;
          inputData = {};
          inputData["aws_access_key_id"] = key_id;
          inputData["aws_secret_access_key"] = secret_key;
          return $.ajax({
            url: "/verify_aws_login",
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(inputData),
            success: function(response) {
              if (response.aws_accnt === 0) {
                _this.getCredentials();
                return $('#aws-indicator').css("color", "red").attr("class", "icon-lock");
              } else {
                return $('#aws-indicator').css("color", "white").attr("class", "icon-unlock");
              }
            },
            error: function() {
              return console.log("aws verification failed");
            }
          });
        }));
      };

      SideBarView.prototype.save = function(event) {
        var configData, inputData, section,
          _this = this;
        event.preventDefault();
        section = $(event.target).data('section');
        inputData = {};
        configData = {};
        $.each($('#myform').serializeArray(), function(i, field) {
          return inputData[field.name] = field.value;
        });
        configData[section] = inputData;
        this.options.config.save(configData);
        $('li').removeClass('selected');
        $('#overview').addClass('selected');
        $.when(this.options.config.fetch(), this.options.ataglance.fetch().then(function() {
          var hit_view, overview, saveSandbox;
          overview = _.template(OverviewTemplate, {
            input: {
              balance: _this.options.ataglance.get("balance"),
              debug: _this.options.config.get("Server Parameters").debug === "True" ? "checked" : "",
              using_sandbox: _this.options.config.get("HIT Configuration").using_sandbox === "True" ? "checked" : ""
            }
          });
          $('#content').html(overview);
          hit_view = new HITView({
            collection: new HITs
          });
          $("#tables").html(hit_view.render().el);
          saveSandbox = _.bind(_this.saveUsingSandboxState, _this);
          $('input#using_sandbox').on("click", function() {
            return saveSandbox();
          });
          return $('input#debug').on("click", function() {
            return _this.saveDebugState();
          });
        }));
        $.ajax({
          url: "/monitor_server"
        });
        return this.render();
      };

      SideBarView.prototype.pushstateClick = function(event) {
        return event.preventDefault();
      };

      SideBarView.prototype.events = {
        'click a': 'pushstateClick',
        'click .save_data': 'save',
        'click #aws-info-save': 'save',
        'click #server-parms-save': 'serverParamsSave',
        'click input#debug': 'saveDebugState',
        'click input#using_sandbox': 'saveUsingSandboxState'
      };

      SideBarView.prototype.serverParamsSave = function() {
        var configResetPromise;
        this.save();
        configResetPromise = this.options.config.fetch();
        return configResetPromise.done(function() {
          var domain, url, url_pattern;
          url = this.options.config.get("HIT Configuration").question_url + '/shutdown';
          url_pattern = /^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i;
          domain = url.match(url_pattern)[0] + this.options.config.get("Server Parameters").port + '/shutdown';
          return $.ajax({
            url: domain,
            type: "GET",
            data: {
              hash: this.options.config.get("Server Parameters").hash
            }
          });
        });
      };

      SideBarView.prototype.saveDebugState = function() {
        var debug;
        debug = $("input#debug").is(':checked');
        return this.options.config.save({
          "Server Parameters": {
            debug: debug
          }
        });
      };

      SideBarView.prototype.saveUsingSandboxState = function() {
        var using_sandbox,
          _this = this;
        using_sandbox = $("input#using_sandbox").is(':checked');
        return this.options.config.save({
          "HIT Configuration": {
            using_sandbox: using_sandbox
          }
        }, {
          complete: function() {
            return $.when(_this.options.config.fetch(), _this.options.ataglance.fetch().done(function() {
              return _this.loadOverview();
            }));
          }
        }, {
          error: function(error) {
            return console.log("error");
          }
        });
      };

      SideBarView.prototype.initialize = function() {
        this.render();
        this.verifyAWSLogin();
        return this.captureUIEvents();
      };

      SideBarView.prototype.getCredentials = function() {
        var _this = this;
        $('#aws-info-modal').modal('show');
        return $('.save').click(function(event) {
          event.preventDefault();
          _this.save(event);
          return $('#aws-info-modal').modal('hide');
        });
      };

      SideBarView.prototype.getExperimentStatus = function() {
        console.log("updating status");
        return $.ajax({
          url: '/get_hits',
          type: "GET",
          success: function(data) {
            if (data.hits.length > 0) {
              $('#experiment_status').css({
                "color": "green"
              });
              return $('#run').css({
                "color": "grey"
              });
            } else {
              $('#experiment_status').css({
                "color": "grey"
              });
              return $('#run').css({
                "color": "orange"
              });
            }
          }
        });
      };

      SideBarView.prototype.captureUIEvents = function() {
        var _this = this;
        return $('#run').on("click", function() {
          var runExptView, updateExperimentStatus;
          runExptView = new RunExptView({
            config: _this.options.config
          });
          $('#run-expt-modal').modal('show');
          $('.run-expt').on("keyup", function(event) {
            var TURK_FEE_RATE, configData, inputData;
            inputData = {};
            configData = {};
            $.each($('#expt-form').serializeArray(), function(i, field) {
              return inputData[field.name] = field.value;
            });
            TURK_FEE_RATE = 0.10;
            $('#total').html((inputData["reward"] * inputData["max_assignments"] * (1 + TURK_FEE_RATE)).toFixed(2));
            $('#fee').val((inputData["reward"] * inputData["max_assignments"] * TURK_FEE_RATE).toFixed(2));
            configData["HIT Configuration"] = inputData;
            return _this.options.config.save(configData);
          });
          updateExperimentStatus = _.bind(_this.getExperimentStatus, _this);
          return $('#run-expt-btn').on("click", function() {
            return $.ajax({
              contentType: "application/json; charset=utf-8",
              url: '/mturk_services',
              type: "POST",
              dataType: 'json',
              data: JSON.stringify({
                mturk_request: "create_hit"
              }),
              complete: function() {
                var hit_view;
                $('#run-expt-modal').modal('hide');
                hit_view = new HITView({
                  collection: new HITs
                });
                $("#tables").html(hit_view.render().el);
                return updateExperimentStatus();
              },
              error: function(error) {
                console.log(error);
                return $('#expire-modal').modal('hide');
              }
            });
          });
        });
      };

      SideBarView.prototype.loadOverview = function() {
        var _this = this;
        return $.when(this.options.config.fetch(), this.options.ataglance.fetch().then(function() {
          var hit_view, overview, recaptureUIEvents, saveSandbox;
          overview = _.template(OverviewTemplate, {
            input: {
              balance: _this.options.ataglance.get("balance"),
              debug: _this.options.config.get("Server Parameters").debug === "True" ? "checked" : "",
              using_sandbox: _this.options.config.get("HIT Configuration").using_sandbox === "True" ? "checked" : ""
            }
          });
          $('#content').html(overview);
          hit_view = new HITView({
            collection: new HITs
          });
          $("#tables").html(hit_view.render().el);
          saveSandbox = _.bind(_this.saveUsingSandboxState, _this);
          recaptureUIEvents = _.bind(_this.captureUIEvents, _this);
          $('input#using_sandbox').on("click", function() {
            return saveSandbox();
          });
          $('input#debug').on("click", function() {
            return _this.saveDebugState();
          });
          return recaptureUIEvents();
        }));
      };

      SideBarView.prototype.render = function() {
        var hit_view, saveConfig, saveSandbox, updateExperimentStatus, updateOverview,
          _this = this;
        $('li').on('click', function() {
          $('li').removeClass('selected');
          return $(this).addClass('selected');
        });
        $('#shutdown-dashboard').on('click', function() {
          return $.ajax({
            url: '/shutdown',
            type: "GET",
            complete: function() {
              return window.location.replace("http://nyuccl.github.io/psiTurk/");
            }
          });
        });
        $.when(this.options.config.fetch(), this.options.ataglance.fetch().done(function() {
          var awsInfo, database, exptInfo, hitConfig, saveConfig, serverParams, validator;
          awsInfo = _.template(AWSInfoTemplate, {
            input: {
              aws_access_key_id: _this.options.config.get("AWS Access").aws_access_key_id,
              aws_secret_access_key: _this.options.config.get("AWS Access").aws_secret_access_key
            }
          });
          hitConfig = _.template(HITConfigTemplate, {
            input: {
              title: _this.options.config.get("HIT Configuration").title,
              description: _this.options.config.get("HIT Configuration").description,
              keywords: _this.options.config.get("HIT Configuration").keywords,
              question_url: _this.options.config.get("HIT Configuration").question_url,
              max_assignments: _this.options.config.get("HIT Configuration").max_assignments,
              hit_lifetime: _this.options.config.get("HIT Configuration").hit_lifetime,
              reward: _this.options.config.get("HIT Configuration").reward,
              duration: _this.options.config.get("HIT Configuration").duration,
              us_only: _this.options.config.get("HIT Configuration").us_only,
              approve_requirement: _this.options.config.get("HIT Configuration").approve_requirement,
              using_sandbox: _this.options.config.get("HIT Configuration").using_sandbox
            }
          });
          database = _.template(DatabaseTemplate, {
            input: {
              database_url: _this.options.config.get("Database Parameters").database_url,
              table_name: _this.options.config.get("Database Parameters").table_name
            }
          });
          serverParams = _.template(ServerParamsTemplate, {
            input: {
              host: _this.options.config.get("Server Parameters").host,
              port: _this.options.config.get("Server Parameters").port,
              cutoff_time: _this.options.config.get("Server Parameters").cutoff_time,
              support_ie: _this.options.config.get("Server Parameters").support_ie
            }
          });
          exptInfo = _.template(ExptInfoTemplate, {
            input: {
              code_version: _this.options.config.get("Task Parameters").code_version,
              num_conds: _this.options.config.get("Task Parameters").num_conds,
              num_counters: _this.options.config.get("Task Parameters").num_counters
            }
          });
          validator = new Validators;
          saveConfig = _.bind(_this.save, _this);
          $('#overview').off('click').on('click', function() {
            $('li').removeClass('selected');
            $('#overview').addClass('selected');
            return _this.loadOverview();
          });
          $('#aws-info').on('click', function() {
            $('#content').html(awsInfo);
            validator.loadValidators();
            $('#myform').submit(false);
            return $('.save').on("click", function(event) {
              event.preventDefault();
              return saveConfig(event);
            });
          });
          $('#hit-config').on('click', function() {
            $('#content').html(hitConfig);
            validator.loadValidators();
            $('#myform').submit(false);
            return $('.save').on("click", function(event) {
              return saveConfig(event);
            });
          });
          $('#database').on('click', function() {
            $('#content').html(database);
            validator.loadValidators();
            $('#myform').submit(false);
            return $('.save').on("click", function(event) {
              event.preventDefault();
              return saveConfig(event);
            });
          });
          $('#server-params').on('click', function() {
            $('#content').html(serverParams);
            validator.loadValidators();
            $('#myform').submit(false);
            return $('.save').on("click", function(event) {
              event.preventDefault();
              return saveConfig(event);
            });
          });
          $('#expt-info').on('click', function() {
            $('#content').html(exptInfo);
            validator.loadValidators();
            $('#myform').submit(false);
            return $('.save').on("click", function(event) {
              event.preventDefault();
              return saveConfig(event);
            });
          });
          return $('#contribute').on('click', function() {
            return window.open('https://github.com/NYUCCL/psiTurk');
          });
        }));
        hit_view = new HITView({
          collection: new HITs
        });
        $("#tables").html(hit_view.render().el);
        saveSandbox = _.bind(this.saveUsingSandboxState, this);
        saveConfig = _.bind(this.save, this);
        $(document).on("click", '.save', function() {
          event.preventDefault();
          saveConfig(event);
          return $(document).on("click", '.save_data', function(event) {
            event.preventDefault();
            return saveConfig(event);
          });
        });
        $('input#using_sandbox').on("click", function() {
          return saveSandbox();
        });
        $('input#debug').on("click", function() {
          return _this.saveDebugState();
        });
        $(document).off("click").on("click", '#aws-info-save', function() {
          return _this.verifyAWSLogin();
        });
        $(document).on("click", '#server-parms-save', function() {
          return _this.serverParamsSave();
        });
        updateExperimentStatus = _.bind(this.getExperimentStatus, this);
        updateOverview = _.bind(this.loadOverview, this);
        $(document).on("click", '.expire', function() {
          var hitid;
          hitid = $(this).attr('id');
          $('#expire-modal').modal('show');
          return $('#expire-btn').on('click', function() {
            var data;
            data = JSON.stringify({
              mturk_request: "expire_hit",
              hitid: hitid
            });
            return $.ajax({
              contentType: "application/json; charset=utf-8",
              url: '/mturk_services',
              type: "POST",
              dataType: 'json',
              data: data,
              complete: function() {
                $('#expire-modal').modal('hide');
                updateExperimentStatus();
                return updateOverview();
              },
              error: function(error) {
                return console.log("failed to expire HIT");
              }
            });
          });
        });
        return $(document).on("click", '.extend', function() {
          var hitid;
          hitid = $(this).attr('id');
          $('#extend-modal').modal('show');
          return $('#extend-btn').on('click', function() {
            var data;
            data = JSON.stringify({
              mturk_request: "extend_hit",
              hitid: hitid,
              assignments_increment: $('#extend-workers').val(),
              expiration_increment: $('#extend-time').val()
            });
            return $.ajax({
              contentType: "application/json; charset=utf-8",
              url: '/mturk_services',
              type: "POST",
              dataType: 'json',
              data: data,
              complete: function() {
                $('#extend-modal').modal('hide');
                updateExperimentStatus();
                return updateOverview();
              },
              error: function(error) {
                return console.log("failed to extend HIT");
              }
            });
          });
        });
      };

      return SideBarView;

    })(Backbone.View);
  });

}).call(this);
