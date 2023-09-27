use crate::{
    ghin::{Ghin, ApiCall},
    handicap::{GetPlayingHandicapsRequest, GetPlayingHandicapsResponse},
};
use reqwest::Error;
use tonic::Request;

#[allow(non_snake_case)]
mod handicap {
    include!("generated/handicap.rs");
}

pub fn get_call() -> ApiCall<GetPlayingHandicapsRequest, GetPlayingHandicapsResponse> {
    ApiCall {
        name: "get_playing_handicaps".to_string(),
        call_fn: Box::new(call_fn),
        process_fn: process_fn,
        retries: 2,
    }
}


async fn call_fn(
    ghin: &Ghin,
    request: &Request<GetPlayingHandicapsRequest>,
) -> Result<reqwest::Response, Error> {

    let uri = format!(
        "{}/playing_handicaps.json",
        ghin.settings.ghin.url.to_owned(),
    );

    let payload: GetPlayingHandicapsRequest = request.get_ref().to_owned();

    ghin
        .client
        .post(uri)
        .json(&payload)
        .bearer_auth(&ghin.token)
        .send()
        .await
}

fn process_fn(response: reqwest::Response) -> Result<GetPlayingHandicapsResponse, anyhow::Error> {
    // let resp_text = &response.text().await;
    // debug!("response text: {:?}", resp_text);
    // Err(anyhow!("testing"))

    let c = response.json::<GetPlayingHandicapsResponse>();
    // let f = &c.Facility;
    // let s = &c.Season;
    // let ts = &c.TeeSets;
    let ret = GetPlayingHandicapsResponse { percents: vec![] };
    // course_id: get_i32(&c.CourseId),
    // course_status: get_str(&c.CourseStatus),
    // course_name: get_str(&c.CourseName),
    // facility_id: get_i32(&f.FacilityId),
    // facility_status: get_str(&f.FacilityStatus),
    // facility_name: get_str(&f.FacilityName),
    // geo_location_formatted_address: Some(get_str(&f.GeoLocationFormattedAddress)),
    // geo_location_latitude: get_f32(&f.GeoLocationLatitude),
    // geo_location_longitude: get_f32(&f.GeoLocationLongitude),
    // city: Some(get_str(&c.CourseCity)),
    // state: Some(get_str(&c.CourseState)),
    // season_name: Some(get_str(&s.SeasonName)),
    // season_start_date: Some(get_str(&s.SeasonStartDate)),
    // season_end_date: Some(get_str(&s.SeasonEndDate)),
    // is_all_year: Some(get_bool(&s.IsAllYear)),
    // address1: None,
    // address2: None,
    // country: None,
    // fullname: None,
    // updated_on: None,
    // tees: _get_tees(ts),
    //};
    Ok(ret)
}
