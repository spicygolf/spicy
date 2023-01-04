use anyhow::{anyhow, Result};
// use async_recursion::async_recursion;
use async_trait::async_trait;
use log::{debug, error, info};
use reqwest::{Client,StatusCode};
use serde::{Deserialize, Serialize};
use crate::token::Token;
use crate::settings::Settings;
use crate::handicap::{Club, GetHandicapResponse, GpaResponse, SearchPlayer, Pagination, SearchPlayerResponse};

pub struct Ghin {
  client: Client,
  settings: Settings,
}

#[derive(Serialize, Debug)]
struct User {
  email: String,
  password: String,
  remember_me: bool,
}

#[derive(Serialize, Debug)]
struct LoginPayload {
  user: User,
}

#[derive(Deserialize, Debug)]
struct LoginResponse {
  token: String,
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

#[derive(Serialize, Debug)]
struct GpaPayload {
  email: String,
}

#[derive(Deserialize, Debug)]
struct GpaPostResponse {
  success: String,
}


#[async_trait]
pub trait GhinHandicapService {
  fn new() -> Self;
  // #[async_recursion]
  async fn login(&self, user_token: &Token) -> Result<()>;
  async fn search_player(&self, attempts: u8, token: &Token, q: SearchPlayer, p: Pagination) -> Result<SearchPlayerResponse>;
  async fn request_gpa(&self, attempts: u8, token: &Token, id: String, email: String) -> Result<GpaResponse>;
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

  async fn login(&self, user_token: &Token) -> Result<()> {
    // body/payload
    let user = User {
      email: self.settings.ghin.username.to_owned(),
      password: self.settings.ghin.password.to_owned(),
      remember_me: true,
    };
    let payload = LoginPayload {
      user,
    };

    // request
    let uri = self.settings.ghin.url.to_owned() + "/users/login.json";
    let response = self.client
      .post(uri)
      .json(&payload)
      .send()
      .await?;

    // debug!("login response {:#?}", response);

    let LoginResponse { token } = response.json::<LoginResponse>().await?;
    info!("Refreshing GHIN token");
    user_token.set_token(token).await
  }

  async fn search_player(
    &self,
    attempts: u8,
    token: &Token,
    q: SearchPlayer,
    p: Pagination,
  ) -> Result<SearchPlayerResponse> {

    if attempts == 2 {
      return Err(anyhow!(
        "Too many unsuccessful attempts to get GHIN handicap."
      ));
    }

    let t = token.token().await;
    let uri = self.settings.ghin.url.to_owned() + "/golfers/search.json";

    let response = self.client
      .get(uri)
      .query(&[("page", &p.page)])
      .query(&[("per_page", &p.per_page)])
      .query(&[("golfer_id", &q.golfer_id)])
      .query(&[("state", &q.state)])
      .query(&[("country", &q.country)])
      .query(&[("last_name", &q.last_name)])
      .query(&[("first_name", &q.first_name)])
      .query(&[("email", &q.email)])
      .query(&[("status", "Active")])
      .query(&[("sorting_criteria", "full_name")])
      .query(&[("order", "asc")])
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
        let GolfersResponse { golfers } = response.json::<GolfersResponse>().await?;
        debug!("ghin search_player {} {} {} {} {} {}", &q.golfer_id, &q.country, &q.state, &q.last_name, &q.first_name, golfers.len());
        match &q.golfer_id.is_empty() {
          false => rollup_golfer(&golfers),
          true => no_rollup_golfer(&golfers),
        }
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

  async fn request_gpa(
    &self,
    attempts: u8,
    token: &Token,
    id: String,
    email: String,
  ) -> Result<GpaResponse> {

    if attempts == 2 {
      return Err(anyhow!(
        "Too many unsuccessful attempts to request_gpa."
      ));
    }

    let t = token.token().await;
    let uri = format!("{}/users/golfers/{}/request_golfer_product_access.json",
      self.settings.ghin.url.to_owned(), id);

      let payload = GpaPayload {
        email: email.to_owned(),
      };

    let response = self.client
      .post(uri)
      .json(&payload)
      .bearer_auth(t)
      .send()
      .await?;

    // debug!("request_gpa_access response {:#?}", response);

    // return result
    match response.status() {
      StatusCode::OK => {
        let GpaPostResponse { success } = response.json::<GpaPostResponse>().await?;
        Ok(GpaResponse {
          success,
        })
      },
      StatusCode::UNAUTHORIZED => {
        self.login(&token).await?;
        let next_attempt = attempts + 1;
        self.request_gpa(next_attempt, &token, id, email).await
      },
      StatusCode::BAD_REQUEST => {
        let r = response.text().await?;
        error!("BAD_REQUEST: {:?}", r);
        Err(anyhow!("bad request for request_gpa"))
      },
      _ => Err(anyhow!("Unknown request_gpa error")),
    }
  }

}

// -----------------------------------------------------------------------------

fn rollup_golfer(golfers: &Vec<Golfer>) -> Result<SearchPlayerResponse> {
  let g = golfers.iter().nth(0);
  match g {
    Some(g) => {
      let clubs = get_clubs(&golfers);
      Ok(SearchPlayerResponse {
        players: vec![
          get_golfer(g, clubs)
        ]
      })
    },
    None => Err(anyhow!("No golfers in response")),
  }
}

fn no_rollup_golfer(golfers: &Vec<Golfer>) -> Result<SearchPlayerResponse> {
  let ret = SearchPlayerResponse {
    players: golfers
      .iter()
      .map(|g| {
        let clubs = get_club(g);
        get_golfer(g, clubs)
      }).collect()
  };
  Ok(ret)
}

fn get_golfer(g: &Golfer, clubs: Vec<Club>) -> GetHandicapResponse {
  let first_name = get_str(&g.first_name);
  let last_name = get_str(&g.last_name);
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
