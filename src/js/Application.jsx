import React, { Component, PropTypes } from "react";
import BallotLeft from "./components/Navigation/BallotLeft";
import FriendActions from "./actions/FriendActions";
import HeaderBar from "./components/Navigation/HeaderBar";
import Headroom from "headroom.js";
import BookmarkActions from "./actions/BookmarkActions";
import VoterActions from "./actions/VoterActions";
import SearchAllActions from "./actions/SearchAllActions";
import VoterStore from "./stores/VoterStore";
const web_app_config = require("./config");

var loadingScreenStyles = {
  position: "fixed",
  height: "100vh",
  width: "100vw",
  display: "flex",
  top: 0,
  left: 0,
  backgroundColor: "#337ec9",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "30px",
  color: "#fff",
  flexDirection: "column"
};

export default class Application extends Component {
  static propTypes = {
    children: PropTypes.element,
    route: PropTypes.object,
    location: PropTypes.object
  };

  constructor (props) {
    super(props);
    this.state = {};
    this.loadedHeader = false;
    this.initFacebook();
  }

  initFacebook (){
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: web_app_config.FACEBOOK_APP_ID,
        xfbml: true,
        version: "v2.8",
        status: true    // set this status to true, this will fixed popup blocker issue
      });
    };

    (function (d, s, id){
       var js;
       var fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "//connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, "script", "facebook-jssdk"));
  }

  componentDidMount () {
    let voter_device_id = VoterStore.voterDeviceId();
    VoterActions.voterRetrieve();
    // console.log("Application, componentDidMount, voter_device_id:", voter_device_id);
    if (voter_device_id && voter_device_id !== "") {
      VoterActions.voterEmailAddressRetrieve();
      BookmarkActions.voterAllBookmarksStatusRetrieve();
      FriendActions.friendInvitationsSentToMe();
    }
    this.voterStoreListener = VoterStore.addListener(this._onVoterStoreChange.bind(this));
  }

  componentWillUnmount () {
    this.voterStoreListener.remove();
    this.loadedHeader = false;
  }

  componentDidUpdate () {
    if (this.loadedHeader) return;
    if (!this.refs.pageHeader) return;

    // Initialize headroom element
    new Headroom(this.refs.pageHeader, {
      "offset": 50,
      "tolerance": 1,
      "classes": {
        "initial": "headroom--animated",
        "pinned": "headroom--slide-down",
        "unpinned": "headroom--slide-up"
      }
    }).init();

    this.loadedHeader = true;
  }

  _onVoterStoreChange () {
    this.setState({
      voter: VoterStore.getVoter(),
      location: VoterStore.getAddress()
    });
  }

  hideSearchContainer () {
    SearchAllActions.exitSearch();
  }

  render () {
    var { location: { pathname }} = this.props;
    var { voter, location } = this.state;

    if (voter === undefined || location === undefined ) {
      return <div style={loadingScreenStyles}>
                <div>
                  <h1 className="h1">Loading We Vote...</h1>
                  <div className="u-loading-spinner u-loading-spinner--light" />
                </div>
              </div>;
    }
    // If looking at these paths, we want to enter theater mode
    var in_theater_mode = false;
    var content_full_width_mode = false;
    var voter_guide_mode = false;
    if (pathname === "/intro/story" || pathname === "/intro/sample_ballot" || pathname === "/intro/get_started") {
      in_theater_mode = true;
    } else if (pathname === "/ballot" || pathname === "/bookmarks" || pathname.startsWith("/candidate/") ||
      pathname === "/facebook_invitable_friends" || pathname === "/friends" || pathname === "/friends/invitebyemail" ||
      pathname === "/intro" ||
      pathname === "/more/about" || pathname === "/more/connect" ||
      pathname === "/more/donate" || pathname === "/more/howtouse" || pathname.startsWith("/office/") ||
      pathname === "/more/network" || pathname === "/more/organization" ||
      pathname === "/more/privacy" || pathname === "/more/sign_in" || pathname === "/more/team" ||
      pathname === "/more/terms" || pathname === "/more/vision" ||
      pathname === "/opinions" || pathname === "/opinions_followed" || pathname === "/opinions_ignored" ||
      pathname === "/settings/location" || pathname === "/welcome") {
      content_full_width_mode = true;
    } else {
      voter_guide_mode = true;
    }

    if (in_theater_mode) {
      return <div className="app-base" id="app-base-id">
        <div className="page-content-container">
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 container-main">
                { this.props.children }
              </div>
            </div>
          </div>
        </div>
      </div>;
    } else if (voter_guide_mode) {
      console.log("voter_guide_mode", voter_guide_mode);
      return <div className="app-base" id="app-base-id">
        <div className="headroom-wrapper">
          <div ref="pageHeader" className="page-header__container headroom">
            <HeaderBar pathname={pathname} voter={voter} />
          </div>
        </div>
        { this.props.children }
      </div>;
    }

    return <div className="app-base" id="app-base-id">
      <div className="headroom-wrapper">
        <div ref="pageHeader" className="page-header__container headroom">
          <HeaderBar pathname={pathname} voter={voter} />
        </div>
      </div>
      <div className="page-content-container">
        <div className="container-fluid">
          { content_full_width_mode ?
            <div className="row">
              <div className="col-12-container col-12 container-main">
                { this.props.children }
              </div>
            </div> :
            <div className="row">
              <div className="col-md-4 hidden-xs sidebar-menu">
                {/* Depending on which page we are on, show a different left area. */}
                { pathname === "/ballot" ? <BallotLeft /> : null }
              </div>
              <div className="col-md-8 container-main">
                { this.props.children }
              </div>
            </div> }
        </div>
      </div>
    </div>;
  }
}
