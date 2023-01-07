use anyhow::{anyhow, Result};
// use async_recursion::async_recursion;
use crate::handicap::{
    Club, Course, GetCourse, GetHandicapResponse, GetTeesResponse, GpaResponse, Hole, Pagination,
    Rating, SearchCourse, SearchCourseResponse, SearchPlayer, SearchPlayerResponse, SearchTee, Tee,
};
use crate::settings::Settings;
use crate::token::Token;
use async_trait::async_trait;
use log::{debug, error, info};
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};

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

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct GetCourseResp {
    CourseId: Option<i32>,
    CourseStatus: Option<String>,
    CourseName: Option<String>,
    CourseCity: Option<String>,
    CourseState: Option<String>,
    Facility: FacilityResp,
    Season: SeasonResp,
    TeeSets: Vec<TeeResponse>,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct FacilityResp {
    FacilityId: Option<i32>,
    FacilityStatus: Option<String>,
    FacilityName: Option<String>,
    GeoLocationFormattedAddress: Option<String>,
    GeoLocationLatitude: Option<f32>,
    GeoLocationLongitude: Option<f32>,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct SeasonResp {
    SeasonName: Option<String>,
    SeasonStartDate: Option<String>,
    SeasonEndDate: Option<String>,
    IsAllYear: Option<bool>,
}

#[derive(Deserialize, Debug)]
struct CoursesResponse {
    courses: Vec<CourseResponse>,
}

// We need this struct to match the GHIN API json fields
#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct CourseResponse {
    CourseID: Option<i32>,
    CourseStatus: Option<String>,
    CourseName: Option<String>,
    GeoLocationLatitude: Option<f32>,
    GeoLocationLongitude: Option<f32>,
    FacilityID: Option<i32>,
    FacilityStatus: Option<String>,
    FacilityName: Option<String>,
    FullName: Option<String>,
    Address1: Option<String>,
    Address2: Option<String>,
    City: Option<String>,
    State: Option<String>,
    Country: Option<String>,
    UpdatedOn: Option<String>,
}

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct TeesResponse {
    TeeSets: Vec<TeeResponse>,
}

// We need this struct to match the GHIN API json fields
#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct TeeResponse {
    TeeSetRatingID: Option<i32>,
    TeeSetRatingName: Option<String>,
    Gender: Option<String>,
    HolesNumber: Option<i32>,
    TotalYardage: Option<i32>,
    TotalMeters: Option<i32>,
    TotalPar: Option<i32>,
    Ratings: Vec<RatingResponse>,
    Holes: Vec<HoleResponse>,
}

// We need this struct to match the GHIN API json fields
#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct RatingResponse {
    RatingType: Option<String>,
    CourseRating: Option<f32>,
    SlopeRating: Option<f32>,
    BogeyRating: Option<f32>,
}

// We need this struct to match the GHIN API json fields
#[derive(Deserialize, Debug)]
#[allow(non_snake_case)]
struct HoleResponse {
    Number: Option<i32>,
    HoleId: Option<i32>,
    Length: Option<i32>,
    Par: Option<i32>,
    Allocation: Option<i32>,
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
    async fn search_player(
        &self,
        attempts: u8,
        token: &Token,
        q: SearchPlayer,
        p: Pagination,
    ) -> Result<SearchPlayerResponse>;
    async fn get_course(&self, attempts: u8, token: &Token, q: GetCourse) -> Result<Course>;
    async fn search_course(
        &self,
        attempts: u8,
        token: &Token,
        q: SearchCourse,
    ) -> Result<SearchCourseResponse>;
    async fn get_tees(&self, attempts: u8, token: &Token, q: SearchTee) -> Result<GetTeesResponse>;
    async fn request_gpa(
        &self,
        attempts: u8,
        token: &Token,
        id: String,
        email: String,
    ) -> Result<GpaResponse>;
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
        let payload = LoginPayload { user };

        // request
        let uri = self.settings.ghin.url.to_owned() + "/users/login.json";
        let response = self.client.post(uri).json(&payload).send().await?;

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

        let response = self
            .client
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
                debug!(
                    "ghin search_player {} {} {} {} {} {}",
                    &q.golfer_id,
                    &q.country,
                    &q.state,
                    &q.last_name,
                    &q.first_name,
                    golfers.len()
                );
                match &q.golfer_id.is_empty() {
                    false => rollup_golfer(&golfers),
                    true => no_rollup_golfer(&golfers),
                }
            }
            StatusCode::UNAUTHORIZED => {
                self.login(&token).await?;
                let next_attempt = attempts + 1;
                self.search_player(next_attempt, &token, q, p).await
            }
            StatusCode::BAD_REQUEST => {
                let r = response.text().await?;
                error!("BAD_REQUEST: {:?}", r);
                Err(anyhow!("bad request for search_player"))
            }
            _ => Err(anyhow!("Unknown search_player error")),
        }
    }

    async fn get_course(&self, attempts: u8, token: &Token, q: GetCourse) -> Result<Course> {
        if attempts == 2 {
            return Err(anyhow!("Too many unsuccessful attempts to get course."));
        }

        let t = token.token().await;
        // let uri = self.settings.ghin.url.to_owned() + "/courses/{}.json";
        let uri = format!(
            "{}/courses/{}.json",
            self.settings.ghin.url.to_owned(),
            &q.course_id
        );

        let response = self
            .client
            .get(uri)
            .query(&[("name", &q.course_id)])
            .query(&[("include_altered_tees", &q.include_altered_tees)])
            .bearer_auth(t)
            .send()
            .await?;

        // return result
        match response.status() {
            StatusCode::OK => {
                // let resp_text = response.text().await;
                // debug!("response text: {:?}", resp_text);
                // Ok(SearchCourseResponse {
                //   courses: vec![]
                // })

                let c = response.json::<GetCourseResp>().await?;
                let f = &c.Facility;
                let s = &c.Season;
                let ts = &c.TeeSets;
                let ret = Course {
                    course_id: get_i32(&c.CourseId),
                    course_status: get_str(&c.CourseStatus),
                    course_name: get_str(&c.CourseName),
                    facility_id: get_i32(&f.FacilityId),
                    facility_status: get_str(&f.FacilityStatus),
                    facility_name: get_str(&f.FacilityName),
                    geo_location_formatted_address: Some(get_str(&f.GeoLocationFormattedAddress)),
                    geo_location_latitude: get_f32(&f.GeoLocationLatitude),
                    geo_location_longitude: get_f32(&f.GeoLocationLongitude),
                    city: Some(get_str(&c.CourseCity)),
                    state: Some(get_str(&c.CourseState)),
                    season_name: Some(get_str(&s.SeasonName)),
                    season_start_date: Some(get_str(&s.SeasonStartDate)),
                    season_end_date: Some(get_str(&s.SeasonEndDate)),
                    is_all_year: Some(get_bool(&s.IsAllYear)),
                    address1: None,
                    address2: None,
                    country: None,
                    fullname: None,
                    updated_on: None,
                    tees: _get_tees(ts),
                };
                Ok(ret)
            }
            StatusCode::UNAUTHORIZED => {
                self.login(&token).await?;
                let next_attempt = attempts + 1;
                self.get_course(next_attempt, &token, q).await
            }
            StatusCode::BAD_REQUEST => {
                let r = response.text().await?;
                error!("BAD_REQUEST: {:?}", r);
                Err(anyhow!("bad request for get_course"))
            }
            _ => Err(anyhow!("Unknown get_course error")),
        }
    }

    async fn search_course(
        &self,
        attempts: u8,
        token: &Token,
        q: SearchCourse,
    ) -> Result<SearchCourseResponse> {
        if attempts == 2 {
            return Err(anyhow!("Too many unsuccessful attempts to search course."));
        }

        let t = token.token().await;
        let uri = self.settings.ghin.url.to_owned() + "/courses/search.json";

        let response = self
            .client
            .get(uri)
            .query(&[("name", &q.course_name)])
            .query(&[("country", &q.country)])
            .query(&[("state", &q.state)])
            .query(&[("include_tee_sets", false)])
            .bearer_auth(t)
            .send()
            .await?;

        // return result
        match response.status() {
            StatusCode::OK => {
                // let resp_text = response.text().await;
                // debug!("response text: {:?}", resp_text);
                // Ok(SearchCourseResponse {
                //   courses: vec![]
                // })

                let CoursesResponse { courses } = response.json::<CoursesResponse>().await?;
                let ret = SearchCourseResponse {
                    courses: courses
                        .iter()
                        .map(|c| {
                            let tees: Vec<Tee> = Vec::new();
                            Course {
                                course_id: get_i32(&c.CourseID),
                                course_status: get_str(&c.CourseStatus),
                                course_name: get_str(&c.CourseName),
                                geo_location_latitude: get_f32(&c.GeoLocationLatitude),
                                geo_location_longitude: get_f32(&c.GeoLocationLongitude),
                                facility_id: get_i32(&c.FacilityID),
                                facility_status: get_str(&c.FacilityStatus),
                                facility_name: get_str(&c.FacilityName),
                                fullname: Some(get_str(&c.FullName)),
                                address1: Some(get_str(&c.Address1)),
                                address2: Some(get_str(&c.Address2)),
                                city: Some(get_str(&c.City)),
                                state: Some(get_str(&c.State)),
                                country: Some(get_str(&c.Country)),
                                updated_on: Some(get_str(&c.UpdatedOn)),
                                geo_location_formatted_address: None,
                                season_name: None,
                                season_start_date: None,
                                season_end_date: None,
                                is_all_year: None,
                                tees,
                            }
                        })
                        .collect::<Vec<Course>>(),
                };
                Ok(ret)
            }
            StatusCode::UNAUTHORIZED => {
                self.login(&token).await?;
                let next_attempt = attempts + 1;
                self.search_course(next_attempt, &token, q).await
            }
            StatusCode::BAD_REQUEST => {
                let r = response.text().await?;
                error!("BAD_REQUEST: {:?}", r);
                Err(anyhow!("bad request for search_course"))
            }
            _ => Err(anyhow!("Unknown search_course error")),
        }
    }

    async fn get_tees(&self, attempts: u8, token: &Token, q: SearchTee) -> Result<GetTeesResponse> {
        if attempts == 2 {
            return Err(anyhow!("Too many unsuccessful attempts to search course."));
        }

        let t = token.token().await;
        let uri = format!(
            "{}/courses/{}/tee_set_ratings.json",
            self.settings.ghin.url.to_owned(),
            &q.course_id
        );

        let response = self
            .client
            .get(uri)
            .query(&[("gender", &q.gender)])
            .query(&[("number_of_holes", &q.number_of_holes)])
            .query(&[("tee_set_status", &q.tee_set_status)])
            .bearer_auth(t)
            .send()
            .await?;

        // return result
        match response.status() {
            StatusCode::OK => {
                // let resp_text = response.text().await;
                // debug!("response text: {:?}", resp_text);
                // Ok(GetTeesResponse {
                //   tees: vec![]
                // })

                let TeesResponse { TeeSets } = response.json::<TeesResponse>().await?;
                let ret = GetTeesResponse {
                    tees: _get_tees(&TeeSets),
                };
                Ok(ret)
            }
            StatusCode::UNAUTHORIZED => {
                self.login(&token).await?;
                let next_attempt = attempts + 1;
                self.get_tees(next_attempt, &token, q).await
            }
            StatusCode::BAD_REQUEST => {
                let r = response.text().await?;
                error!("BAD_REQUEST: {:?}", r);
                Err(anyhow!("bad request for get_tees"))
            }
            _ => Err(anyhow!("Unknown get_tees error")),
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
            return Err(anyhow!("Too many unsuccessful attempts to request_gpa."));
        }

        let t = token.token().await;
        let uri = format!(
            "{}/users/golfers/{}/request_golfer_product_access.json",
            self.settings.ghin.url.to_owned(),
            id
        );

        let payload = GpaPayload {
            email: email.to_owned(),
        };

        let response = self
            .client
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
                Ok(GpaResponse { success })
            }
            StatusCode::UNAUTHORIZED => {
                self.login(&token).await?;
                let next_attempt = attempts + 1;
                self.request_gpa(next_attempt, &token, id, email).await
            }
            StatusCode::BAD_REQUEST => {
                let r = response.text().await?;
                error!("BAD_REQUEST: {:?}", r);
                Err(anyhow!("bad request for request_gpa"))
            }
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
                players: vec![get_golfer(g, clubs)],
            })
        }
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
            })
            .collect(),
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
    golfers
        .iter()
        .map(|g| Club {
            id: get_int_to_str(&g.club_id),
            name: get_str(&g.club_name),
            assn: get_int_to_str(&g.club_affiliation_id),
            state: get_str(&g.state),
            country: get_str(&g.country),
        })
        .collect()
}

fn get_club(g: &Golfer) -> Vec<Club> {
    Vec::from([Club {
        id: get_int_to_str(&g.club_id),
        name: get_str(&g.club_name),
        assn: get_int_to_str(&g.club_affiliation_id),
        state: get_str(&g.state),
        country: get_str(&g.country),
    }])
}

fn _get_tees(tee_sets: &Vec<TeeResponse>) -> Vec<Tee> {
    let ret = tee_sets
        .iter()
        .map(|t| Tee {
            tee_id: get_i32(&t.TeeSetRatingID),
            tee_name: get_str(&t.TeeSetRatingName),
            gender: get_str(&t.Gender),
            holes_number: get_i32(&t.HolesNumber),
            total_yardage: get_i32(&t.TotalYardage),
            total_meters: get_i32(&t.TotalMeters),
            total_par: get_i32(&t.TotalPar),
            ratings: get_ratings(&t.Ratings),
            holes: get_holes(&t.Holes),
        })
        .collect::<Vec<Tee>>();
    return ret;
}

fn get_ratings(ratings: &Vec<RatingResponse>) -> Vec<Rating> {
    ratings
        .iter()
        .map(|r| Rating {
            rating_type: get_str(&r.RatingType),
            course_rating: get_f32(&r.CourseRating),
            slope_rating: get_f32(&r.SlopeRating),
            bogey_rating: get_f32(&r.BogeyRating),
        })
        .collect()
}

fn get_holes(holes: &Vec<HoleResponse>) -> Vec<Hole> {
    holes
        .iter()
        .map(|h| Hole {
            number: get_i32(&h.Number),
            hole_id: get_i32(&h.HoleId),
            length: get_i32(&h.Length),
            par: get_i32(&h.Par),
            allocation: get_i32(&h.Allocation),
        })
        .collect()
}

fn get_str(f: &Option<String>) -> String {
    f.to_owned().unwrap_or(String::from(""))
}

fn get_i32(f: &Option<i32>) -> i32 {
    f.to_owned().unwrap_or(0)
}

fn get_f32(f: &Option<f32>) -> f32 {
    f.to_owned().unwrap_or(0.0)
}

fn get_bool(f: &Option<bool>) -> bool {
    f.to_owned().unwrap_or(false)
}

fn get_int_to_str(f: &Option<i32>) -> String {
    f.to_owned().unwrap_or(0).to_string()
}
