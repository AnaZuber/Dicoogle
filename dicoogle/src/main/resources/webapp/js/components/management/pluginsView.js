import React from "react";
import createReactClass from "create-react-class";
import * as PluginActions from "../../actions/pluginActions";
import PluginStore from "../../stores/pluginStore";

const PluginsView = createReactClass({
  getInitialState() {
    return {
      plugins: {},
      currentlyLoading: 4,
      status: "loading",
      error: null
    };
  },

  componentWillMount() {
    this.unsubscribe = PluginStore.listen(this._onPluginsChange);
  },

  componentDidMount: function() {
    const pluginTypes = ["query", "index", "storage", "servlet"];
    pluginTypes.map(type => PluginActions.get(type));
  },

  componentWillUnmount: function() {
    this.unsubscribe();
  },

  _onPluginsChange(data) {
    this.setState({
      error: data.error
    });

    if (this.state.actionPerformed) {
      this.setState({
        actionPerformed: false
      });

      if (this.state.error) {
        this.props.showToastMessage("error", {
          title: "Error",
          body: this.state.error
        });
      } else {
        this.props.showToastMessage("success", { title: "Saved" });
      }
    }

    if (!data.success) {
      return;
    }

    if (data.data.length !== 0) {
      let plugins = {};
      
      // apply this structure: plugins[query]: [...] ; plugins[storage]: [...] ; ...
      for (const p of data.data) {
        let type = p.type;
        if (!plugins[type]) {
          plugins[type] = [];
        }
        plugins[type].push(p);
      }

      // let new plugin lists override the old ones
      this.setState({
        plugins: {
          ...this.state.plugins,
          ...plugins
        }
      });
    }

    // decrease loading plugins by one unit. When all the plugins are loaded, the status will be "done"
    this.setState(function(previousState, currentProps) {
      let currentlyLoading = previousState.currentlyLoading - 1;
      let status = previousState.status;

      if (currentlyLoading === 0) {
        status = "done";
      }

      return {
        currentlyLoading: currentlyLoading,
        status: status
      };
    });
  },

  _onActionClicked(type, name, action) {
    PluginActions.setAction(type, name, action);
    this.setState({
      actionPerformed: true
    });
  },

  render() {
    if (this.state.status === "loading") {
      return (
        <div className="loader-inner ball-pulse">
          <div />
          <div />
          <div />
        </div>
      );
    }

    let collapseId = 1;
    const ignoreFieldList = ["name", "type", "enabled"];
    const pluginPanels = Object.keys(this.state.plugins)
      .sort()
      .map((type, i) => {
        return (
          <div className="col-lg-3 col-md-6 col-sm-12" key={i}>
            <p>{type.charAt(0).toUpperCase() + type.slice(1)}</p>
            {this.state.plugins[type].map((plugin, i) => (
              <div className="panel panel-default" key={i}>
                <div className="panel-heading panel-heading-toggle">
                  <h4 className="panel-title">
                    <a
                      className="accordion-toggle collapsed"
                      data-toggle="collapse"
                      data-parent="#accordion"
                      href={"#collapse" + collapseId}
                    >
                      {plugin.name}
                    </a>
                  </h4>
                </div>
                <div
                  id={"collapse" + collapseId++}
                  className="panel-collapse collapse"
                >
                  <div className="panel-body">
                    <button
                      type="button"
                      className={
                        (plugin.enabled
                          ? "btn btn-danger"
                          : "btn btn-success") + " pull-right"
                      }
                      onClick={this._onActionClicked.bind(
                        this,
                        type,
                        plugin.name,
                        plugin.enabled ? "disable" : "enable"
                      )}
                    >
                      {plugin.enabled ? "Disable" : "Enable"}
                    </button>
                    {Object.keys(plugin)
                      .filter(field => ignoreFieldList.indexOf(field) < 0)
                      .filter(field => plugin[field] !== null)
                      .map((field, i) => (
                        <p key={i}>
                          <b>{field}:</b> {plugin[field].toString()}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      });

    return (
      <div className="panel panel-primary topMargin">
        <div className="panel-heading">
          <h3 className="panel-title">Plugins</h3>
        </div>
        <div className="panel-body">
          <div className="row">{pluginPanels}</div>
        </div>
        {/* <div className="toast">Saved</div> */}
      </div>
    );
  }
});

export { PluginsView };
