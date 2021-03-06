import React from "react";
import { Stack, StackItem, Grid, GridItem } from "nr1";
import {
  Card,
  Image,
  Statistic,
  Tab,
  Label,
  Menu,
  Icon
} from "semantic-ui-react";
import AccountPicker from "./account-picker";
import SplashPage from "./splashpage";
import { nerdGraphQuery, EntitySearchByAccount } from "./utils";
import { SemipolarLoading } from "react-loadingg";
import Fullscreen from "react-full-screen";

import Critical from "./assets/CRITICAL.png";
import Warning from "./assets/WARNING.png";
import NotAlerting from "./assets/NOT_ALERTING.png";
import NotConfigured from "./assets/NOT_CONFIGURED.png";

const notificationCount = {
  APM: 0,
  HOST: 0,
  BROWSER: 0,
  MOBILE: 0,
  SYNTHETICS: 0,
  DATABASE: 0,
  EXTERNAL: 0
};

const notificationColor = {
  APM: "green",
  HOST: "green",
  BROWSER: "green",
  MOBILE: "green",
  SYNTHETICS: "green",
  DATABASE: "green",
  EXTERNAL: "green"
};

const refresh = 30000;

export default class AlertsDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entities: [],
      account: "",
      selectedAccountId: undefined,
      loading: true,
      showTabs: false,
      isFull: false,
      fullscreenDisabled: true,
      notificationCount,
      notificationColor
    };
    this.onAccountSelected = this.onAccountSelected.bind(this);
    this.fetchEntities = this.fetchEntities.bind(this);
    this.initialState = {};
  }

  goFull = () => {
    this.setState({ isFull: true });
  };

  componentDidMount() {
    this.interval = setInterval(
      () => this.fetchEntities(this.state.selectedAccountId),
      refresh
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async onAccountSelected(accountId) {
    this.setState({
      selectedAccountId: accountId
    });
    this.fetchEntities(accountId);
  }

  fetchEntities = async (accountId, cursor) => {
    let { entities } = this.state;
    if (!cursor) {
      entities = [];
    }
    let nerdGraphResult = await nerdGraphQuery(
      EntitySearchByAccount(accountId, cursor)
    );
    let entitySearchResults =
      (((nerdGraphResult || {}).actor || {}).entitySearch || {}).results || {};
    entities = [...entities, ...entitySearchResults.entities];
    await this.setState({ entities });
    if (entitySearchResults.nextCursor) {
      this.fetchEntities(accountId, entitySearchResults.nextCursor);
    } else {
      if (this.state.entities.length != 0) {
        this.sortbySeverity(this.state.entities);
        this.setState({
          loading: false,
          showTabs: true,
          fullscreenDisabled: false,
          notificationCount,
          notificationColor
        });
      } else {
        this.setState({
          loading: false,
          showTabs: false,
          fullscreenDisabled: true,
          notificationCount,
          notificationColor
        });
      }
      this.renderNotificationCount();
    }
  };

  sortbySeverity(data) {
    var severtityOrder = [
      "CRITICAL",
      "WARNING",
      "NOT_ALERTING",
      "NOT_CONFIGURED"
    ];
    let sortedData = data.sort((a, b) => {
      return (
        severtityOrder.indexOf(a.alertSeverity) -
        severtityOrder.indexOf(b.alertSeverity)
      );
    });
  }

  setAnimation(alertSeverity) {
    if (alertSeverity == "CRITICAL") return "shake";
    else return "";
  }

  setColor(alertSeverity) {
    switch (alertSeverity) {
      case "CRITICAL":
        return "red";
      case "NOT_ALERTING":
        return "green";
      case "NOT_CONFIGURED":
        return "grey";
      case "WARNING":
        return "orange";
      default:
        return "white";
    }
  }

  setLogo(alertSeverity) {
    switch (alertSeverity) {
      case "CRITICAL":
        return Critical;
      case "NOT_ALERTING":
        return NotAlerting;
      case "NOT_CONFIGURED":
        return NotConfigured;
      case "WARNING":
        return Warning;
      default:
        return "";
    }
  }

  renderCounts() {
    let counts = {
      CRITICAL: 0,
      WARNING: 0,
      NOT_ALERTING: 0,
      NOT_CONFIGURED: 0
    };

    return (
      <div>
        <Statistic.Group style={{ margin: "9px 15px 0px 0px" }}>
          {this.state.entities.map((entity, i) => {
            if (entity.alertSeverity == "CRITICAL") {
              counts.CRITICAL = counts.CRITICAL + 1;
            } else if (entity.alertSeverity == "WARNING") {
              counts.WARNING = counts.WARNING + 1;
            } else if (entity.alertSeverity == "NOT_ALERTING") {
              counts.NOT_ALERTING = counts.NOT_ALERTING + 1;
            } else {
              counts.NOT_CONFIGURED = counts.NOT_CONFIGURED + 1;
            }
          })}
          <Statistic color="red">
            <Statistic.Value>{counts.CRITICAL}</Statistic.Value>
            <Statistic.Label>Critical</Statistic.Label>
          </Statistic>
          <Statistic color="orange">
            <Statistic.Value>{counts.WARNING}</Statistic.Value>
            <Statistic.Label>Warning</Statistic.Label>
          </Statistic>
          <Statistic color="green">
            <Statistic.Value>{counts.NOT_ALERTING}</Statistic.Value>
            <Statistic.Label>Not Alerting</Statistic.Label>
          </Statistic>
          <Statistic color="grey">
            <Statistic.Value>{counts.NOT_CONFIGURED}</Statistic.Value>
            <Statistic.Label>Not Configured</Statistic.Label>
          </Statistic>
        </Statistic.Group>
      </div>
    );
  }

  renderNotificationCount() {
    let apm = 0;
    let host = 0;
    let browser = 0;
    let mobile = 0;
    let synthetics = 0;
    {
      this.state.entities.map(entity => {
        if (entity.alertSeverity == "CRITICAL") {
          if (entity.entityType === "APM_APPLICATION_ENTITY") {
            apm = apm + 1;
            this.setState(prevState => ({
              notificationCount: {
                ...prevState.notificationCount,
                APM: apm
              },
              notificationColor: {
                ...prevState.notificationColor,
                APM: "red"
              }
            }));
          } else if (entity.entityType === "BROWSER_APPLICATION_ENTITY") {
            browser = browser + 1;
            this.setState(prevState => ({
              notificationCount: {
                ...prevState.notificationCount,
                BROWSER: browser
              },
              notificationColor: {
                ...prevState.notificationColor,
                BROWSER: "red"
              }
            }));
          } else if (entity.entityType === "MOBILE_APPLICATION_ENTITY") {
            mobile = mobile = 1;
            this.setState(prevState => ({
              notificationCount: {
                ...prevState.notificationCount,
                MOBILE: mobile
              },
              notificationColor: {
                ...prevState.notificationColor,
                MOBILE: "red"
              }
            }));
          } else if (entity.entityType === "INFRASTRUCTURE_HOST_ENTITY") {
            host = host + 1;
            this.setState(prevState => ({
              notificationCount: {
                ...prevState.notificationCount,
                HOST: host
              },
              notificationColor: {
                ...prevState.notificationColor,
                HOST: "red"
              }
            }));
          } else if (entity.entityType === "SYNTHETIC_MONITOR_ENTITY") {
            synthetics = synthetics + 1;
            this.setState(prevState => ({
              notificationCount: {
                ...prevState.notificationCount,
                SYNTHETICS: synthetics
              },
              notificationColor: {
                ...prevState.notificationColor,
                SYNTHETICS: "red"
              }
            }));
          }
        }
      });
    }
  }

  rendercards(type, entityType) {
    if (this.state.loading) {
      return <SemipolarLoading color="#0189A4" />;
    } else {
      if (this.state.entities.length > 0) {
        return (
          <Tab.Pane>
            <div>
              <Card.Group style={{ margin: "auto", width: "100%" }} centered>
                {this.state.entities.map((entity, i) => {
                  if (
                    entity.type === type &&
                    entity.entityType === entityType
                  ) {
                    return (
                      <Card
                        color={this.setColor(entity.alertSeverity)}
                        key={i}
                        className={this.setAnimation(entity.alertSeverity)}
                      >
                        <Card.Content>
                          <Image
                            alt={entity.alertSeverity}
                            floated="right"
                            size="mini"
                            src={this.setLogo(entity.alertSeverity)}
                          />
                          <Card.Header>
                            <a
                              href={entity.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {entity.name}
                            </a>
                          </Card.Header>
                        </Card.Content>
                      </Card>
                    );
                  }
                })}
              </Card.Group>
            </div>
          </Tab.Pane>
        );
      } else {
        return <SplashPage {...this.state}></SplashPage>;
      }
    }
  }

  renderContainer() {
    if (!this.state.showTabs) {
      return this.rendercards();
    } else {
      return (
        <>
          <Tab panes={this.renderTabs()} style={{ background: "#fff" }} />
        </>
      );
    }
  }

  renderTabs() {
    const panes = [
      {
        menuItem: (
          <Menu.Item key="apm">
            APPLICATION
            <Label circular color={this.state.notificationColor.APM} floating>
              {this.state.notificationCount.APM}
            </Label>
          </Menu.Item>
        ),
        render: () => this.rendercards("APPLICATION", "APM_APPLICATION_ENTITY")
      },
      {
        menuItem: (
          <Menu.Item key="host">
            HOST
            <Label circular color={this.state.notificationColor.HOST} floating>
              {this.state.notificationCount.HOST}
            </Label>
          </Menu.Item>
        ),
        render: () => this.rendercards("HOST", "INFRASTRUCTURE_HOST_ENTITY")
      },
      {
        menuItem: (
          <Menu.Item key="browser">
            FRONT END
            <Label
              circular
              color={this.state.notificationColor.BROWSER}
              floating
            >
              {this.state.notificationCount.BROWSER}
            </Label>
          </Menu.Item>
        ),
        render: () =>
          this.rendercards("APPLICATION", "BROWSER_APPLICATION_ENTITY")
      },
      {
        menuItem: (
          <Menu.Item key="mobile">
            MOBILE APP
            <Label
              circular
              color={this.state.notificationColor.MOBILE}
              floating
            >
              {this.state.notificationCount.MOBILE}
            </Label>
          </Menu.Item>
        ),
        render: () =>
          this.rendercards("APPLICATION", "MOBILE_APPLICATION_ENTITY")
      },
      {
        menuItem: (
          <Menu.Item key="synthetics">
            SYNTHETICS
            <Label
              circular
              color={this.state.notificationColor.SYNTHETICS}
              floating
            >
              {this.state.notificationCount.SYNTHETICS}
            </Label>
          </Menu.Item>
        ),
        render: () => this.rendercards("MONITOR", "SYNTHETIC_MONITOR_ENTITY")
      },
      {
        menuItem: (
          <Menu.Item key="database">
            DATABASE
            <Label
              circular
              color={this.state.notificationColor.DATABASE}
              floating
            >
              {this.state.notificationCount.DATABASE}
            </Label>
          </Menu.Item>
        ),
        render: () =>
          this.rendercards("APPLICATION", "APM_DATABASE_INSTANCE_ENTITY")
      },
      {
        menuItem: (
          <Menu.Item key="external">
            EXTERNAL
            <Label
              circular
              color={this.state.notificationColor.EXTERNAL}
              floating
            >
              {this.state.notificationCount.EXTERNAL}
            </Label>
          </Menu.Item>
        ),
        render: () =>
          this.rendercards("APPLICATION", "APM_EXTERNAL_SERVICE_ENTITY")
      }
    ];
    return panes;
  }

  render() {
    return (
      <>
        <Stack
          className="toolbar-container"
          fullWidth
          gapType={Stack.GAP_TYPE.NONE}
          horizontalType={Stack.HORIZONTAL_TYPE.FILL_EVENLY}
          verticalType={Stack.VERTICAL_TYPE.FILL}
        >
          <StackItem className="toolbar-section1">
            <Stack
              gapType={Stack.GAP_TYPE.NONE}
              fullWidth
              verticalType={Stack.VERTICAL_TYPE.FILL}
            >
              <StackItem className="toolbar-item has-separator">
                <AccountPicker
                  accountChangedCallback={this.onAccountSelected}
                />
              </StackItem>
            </Stack>
          </StackItem>
          <StackItem className="toolbar-section2">
            <Stack
              fullWidth
              fullHeight
              verticalType={Stack.VERTICAL_TYPE.CENTER}
              horizontalType={Stack.HORIZONTAL_TYPE.RIGHT}
            >
              <StackItem>{this.renderCounts()}</StackItem>
              <StackItem>
                <button
                  onClick={this.goFull}
                  disabled={this.state.fullscreenDisabled}
                >
                  <Icon title="TV Mode" name="tv" size="big"></Icon>
                </button>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
        <Fullscreen
          enabled={this.state.isFull}
          onChange={isFull => this.setState({ isFull })}
        >
          <Grid
            className="primary-grid"
            spacingType={[Grid.SPACING_TYPE.NONE, Grid.SPACING_TYPE.NONE]}
          >
            <GridItem className="primary-content-container" columnSpan={12}>
              <main className="primary-content full-height">
                {this.renderContainer()}
              </main>
            </GridItem>
          </Grid>
        </Fullscreen>
      </>
    );
  }
}
