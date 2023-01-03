use anyhow::{anyhow, Result};
// use async_recursion::async_recursion;
use async_trait::async_trait;
use log::{debug, error, info};
use reqwest::{Client,StatusCode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::token::Token;
use crate::settings::Settings;
use crate::handicap::{Club, GetHandicapResponse, Search, Pagination, SearchPlayerResponse};

pub struct Ghin {
  client: Client,
  settings: Settings,
}

#[derive(Serialize, Debug)]
struct User {
  email_or_ghin: String,
  password: String,
  remember_me: bool,
}

#[derive(Serialize, Debug)]
struct LoginPayload {
  source: String,
  user: User,
  token: String,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct AuthTokens {
  token: String,
}

#[derive(Deserialize, Debug)]
struct LoginResponse {
  golfer_user: GolferUser
}

#[derive(Deserialize, Debug)]
struct GolferUser {
  golfer_user_token: String,
}

#[derive(Deserialize, Debug)]
struct GolfersResponse {
  golfers: Vec<Golfer>,
}

#[derive(Deserialize, Debug)]
struct Golfer {
  ghin: Option<String>,
  prefix: Option<String>,
  first_name: Option<String>,
  middle_name: Option<String>,
  last_name: Option<String>,
  suffix: Option<String>,
  handicap_index: Option<String>,
  gender: Option<String>,
  rev_date: Option<String>,
  club_id: Option<i32>,
  club_name: Option<String>,
  club_affiliation_id: Option<i32>,
  state: Option<String>,
  country: Option<String>,
}

#[async_trait]
pub trait GhinHandicapService {
  fn new() -> Self;
  // #[async_recursion]
  async fn get_handicap(&self, attempts: u8, token: &Token, id: String) -> Result<GetHandicapResponse>;
  async fn search_player(&self, attempts: u8, token: &Token, q: Search, p: Pagination) -> Result<SearchPlayerResponse>;
  async fn login(&self, user_token: &Token) -> Result<()>;
  async fn generate_auth_tokens(&self) -> Result<AuthTokens>;
}

impl Default for Ghin {
  fn default() -> Self {
    Self::new()
  }
}

#[async_trait]
impl GhinHandicapService for Ghin {

  fn new() -> Self {
    Self {
      client: Client::default(),
      settings: Settings::default(),
    }
  }

  async fn get_handicap(
    &self,
    attempts: u8,
    token: &Token,
    id: String,
  ) -> Result<GetHandicapResponse> {

    if attempts == 2 {
      return Err(anyhow!(
        "Too many unsuccessful attempts to get GHIN handicap."
      ));
    }

    let url = "https://api2.ghin.com/api/v1/golfers.json";
    let t = token.token().await;

    let response = self.client
      .get(url)
      .query(&[("status", "Active")])
      .query(&[("from_ghin", "true")])
      .query(&[("page", "1")])
      .query(&[("per_page", "25")])
      .query(&[("golfer_id", &id)])
      .query(&[("includeLowHandicapIndex", "true")])
      .query(&[("source", "GHINcom")])
      .bearer_auth(t)
      .send()
      .await?;

    // debug!("get_golfer_handicap response {:#?}", response);

    // return result
    match response.status() {
      StatusCode::OK => {
        // let resp_text = response.text().await;
        // debug!("response text: {:?}", resp_text);
        // Err(anyhow!("testing"))
        let GolfersResponse { golfers } = response.json::<GolfersResponse>().await?;
        let g = golfers.iter().nth(0);
        match g {
          Some(g) => {
            let first_name = get_str(&g.first_name);
            let last_name = get_str(&g.last_name);
            debug!("ghin get_handicap {}: {} {}", &id, first_name, last_name);
            let clubs = get_clubs(&golfers);
            Ok(GetHandicapResponse {
              id: String::from(id),
              source: String::from("ghin"),
              prefix: get_str(&g.prefix),
              first_name: first_name.to_owned(),
              middle_name: get_str(&g.middle_name),
              last_name: last_name.to_owned(),
              suffix: get_str(&g.suffix),
              player_name: format!("{} {}", first_name, last_name),
              gender: get_str(&g.gender),
              active: true,
              index: get_str(&g.handicap_index),
              rev_date: get_str(&g.rev_date),
              clubs,
            })
          },
          None => Err(anyhow!("No golfers in get_golfer_handicap response")),
        }
      },
      StatusCode::UNAUTHORIZED => {
        self.login(&token).await?;
        let next_attempt = attempts + 1;
        self.get_handicap(next_attempt, &token, id).await
      },
      StatusCode::BAD_REQUEST => {
        let r = response.text().await?;
        error!("BAD_REQUEST: {:?}", r);
        Err(anyhow!("bad request for get_golfer_handicap"))
      },
      _ => {
        error!("response status: {:?}", response.status());
        let resp_text = response.text().await;
        error!("response text  : {:?}", resp_text);
        Err(anyhow!("Unknown get_golfer_handicap error"))
      },
    }
  }

  async fn search_player(
    &self,
    attempts: u8,
    token: &Token,
    q: Search,
    p: Pagination,
  ) -> Result<SearchPlayerResponse> {

    if attempts == 2 {
      return Err(anyhow!(
        "Too many unsuccessful attempts to get GHIN handicap."
      ));
    }

    let url = "https://api2.ghin.com/api/v1/golfers.json";
    let t = token.token().await;

    let response = self.client
      .get(url)
      .query(&[("status", "Active")])
      .query(&[("from_ghin", "true")])
      .query(&[("page", &p.page)])
      .query(&[("per_page", &p.per_page)])
      .query(&[("sorting_criteria", "full_name")])
      .query(&[("order", "asc")])
      .query(&[("state", &q.state)])
      .query(&[("last_name", &q.last_name)])
      .query(&[("first_name", &q.first_name)])
      .query(&[("source", "GHINcom")])
      .bearer_auth(t)
      .send()
      .await?;

    // debug!("search_player response {:#?}", response);
    // debug!("ghin search_player {} {} {}", &q.state, &q.last_name, &q.first_name);

    // return result
    match response.status() {
      StatusCode::OK => {
        // let resp_text = response.text().await;
        // debug!("response text: {:?}", resp_text);
        // Err(anyhow!("testing"))
        let GolfersResponse { golfers } = response.json::<GolfersResponse>().await?;
        let ret = SearchPlayerResponse {
          players: golfers
            .iter()
            .map(|g| {
              let first_name = get_str(&g.first_name);
              let last_name = get_str(&g.last_name);
              let clubs = get_club(g);
              GetHandicapResponse {
                id: get_str(&g.ghin),
                source: String::from("ghin"),
                prefix: get_str(&g.prefix),
                first_name: first_name.to_owned(),
                middle_name: get_str(&g.middle_name),
                last_name: last_name.to_owned(),
                suffix: get_str(&g.suffix),
                player_name: format!("{} {}", first_name, last_name),
                gender: get_str(&g.gender),
                active: true,
                index: get_str(&g.handicap_index),
                rev_date: get_str(&g.rev_date),
                clubs,
              }
            }).collect()
        };
        debug!("ghin search_player {} {} {} {}", &q.state, &q.last_name, &q.first_name, ret.players.len());
        Ok(ret)
      },
      StatusCode::UNAUTHORIZED => {
        self.login(&token).await?;
        let next_attempt = attempts + 1;
        self.search_player(next_attempt, &token, q, p).await
      },
      StatusCode::BAD_REQUEST => {
        let r = response.text().await?;
        error!("BAD_REQUEST: {:?}", r);
        Err(anyhow!("bad request for search_player"))
      },
      _ => Err(anyhow!("Unknown search_player error")),
    }
  }

  async fn login(&self, user_token: &Token) -> Result<()> {
    let AuthTokens { token } = self.generate_auth_tokens().await.unwrap();

    let url = "https://api2.ghin.com/api/v1/golfer_login.json";

    // body/payload
    let user = User {
      email_or_ghin: self.settings.ghin.username.to_owned(),
      password: self.settings.ghin.password.to_owned(),
      remember_me: true,
    };
    let payload = LoginPayload {
      user,
      source: String::from("GHINcom"),
      token,
    };

    // request
    let response = self.client
      .post(url)
      .json(&payload)
      .send()
      .await?;

    // debug!("login response {:#?}", response);

    let LoginResponse { golfer_user } = response.json::<LoginResponse>().await?;
    let GolferUser { golfer_user_token } = golfer_user;
    info!("Refreshing GHIN token");
    user_token.set_token(golfer_user_token).await
  }

  async fn generate_auth_tokens(&self) -> Result<AuthTokens> {
    let url = "https://firebaseinstallations.googleapis.com/v1/projects/ghin-mobile-app/installations/ebIg7_MpeE3eniyYXlLy6C/authTokens:generate";

    // body/payload
    let mut sdk = HashMap::new();
    sdk.insert("sdkVersion", "w:0.5.4");
    let mut payload = HashMap::new();
    payload.insert("installation", sdk);

    // request
    let response = self.client
      .post(url)
      .json(&payload)
      .header(
        "Authorization",
        "FIS_v2 2_x40h0MgGeR0FUh_61TJV_PUXWCMAtLeZoU3eyUscNLxWstaBzYq0qTbgedghSn6a",
      )
      .header("x-goog-api-key", "AIzaSyBxgTOAWxiud0HuaE5tN-5NTlzFnrtyz-I")
      .send()
      .await?;

    let j = response.text().await?;
    if let Ok(auth_tokens) = serde_json::from_str(&j.to_string()) {
      Ok(auth_tokens)
    } else {
      Err(anyhow!("auth tokens response error"))
    }
  }

}

fn get_clubs(golfers: &Vec<Golfer>) -> Vec<Club> {
  golfers.iter().map(|g| Club {
    id: get_int_to_str(&g.club_id),
    name: get_str(&g.club_name),
    assn: get_int_to_str(&g.club_affiliation_id),
    state: get_str(&g.state),
    country: get_str(&g.country),
  }).collect()
}

fn get_club(g: &Golfer) -> Vec<Club> {
  Vec::from([
    Club {
      id: get_int_to_str(&g.club_id),
      name: get_str(&g.club_name),
      assn: get_int_to_str(&g.club_affiliation_id),
      state: get_str(&g.state),
      country: get_str(&g.country),
    }
  ])
}

fn get_str(f: &Option<String>) -> String {
  f.to_owned().unwrap_or(String::from(""))
}

fn get_int_to_str(f: &Option<i32>) -> String {
  f.to_owned().unwrap_or(0).to_string()
}
