use crate::ghin::{Ghin, GhinHandicapService};
use crate::token::Token;
use anyhow::anyhow;
use handicap::handicap_server::{Handicap, HandicapServer};
use handicap::{
    GetHandicapRequest, GetHandicapResponse, SearchPlayerRequest, SearchPlayerResponse, Search, Pagination, GpaRequest, GpaResponse,
};
use log::{error, info};
use tonic::{transport::Server, Code, Request, Response, Status};

mod ghin {
    include!("ghin/ghin.rs");
}
mod handicap {
    include!("generated/handicap.rs");
    pub(crate) const FILE_DESCRIPTOR_SET: &[u8] =
        tonic::include_file_descriptor_set!("greeter_descriptor");
}
mod settings;
mod token;

#[derive(Default)]
pub struct HandicapService {
    ghin_token: Token,
}

#[tonic::async_trait]
impl Handicap for HandicapService {
    async fn get_handicap(
        &self,
        request: Request<GetHandicapRequest>,
    ) -> Result<Response<GetHandicapResponse>, Status> {
        let source = request.get_ref().source.to_owned();
        let id = request.get_ref().id.to_owned();

        let response = match source.as_str() {
            "ghin" => {
                let g = Ghin::default();
                let  q = Search {
                    source: source.to_owned(),
                    golfer_id: id.to_owned(),
                    country: "".to_string(),
                    state: "".to_string(),
                    last_name: "".to_string(),
                    first_name: "".to_string(),
                    email: "".to_string(),
                };
                let p = Pagination {
                    page: 1,
                    per_page: 25,
                };
                g.search_player(0, &self.ghin_token, q, p).await
            }
            _ => Err(anyhow!("unknown handicap source: '{}'", source)),
        };

        match response {
            Ok(r) => {
                let ghr = r.players[0].to_owned();
                Ok(Response::new(ghr))
            },
            Err(e) => {
                error!("{:?} for {}: {}", e, source, id);
                Err(Status::new(Code::Unknown, e.to_string()))
            }
        }
    }

    async fn search_player(
        &self,
        request: Request<SearchPlayerRequest>,
    ) -> Result<Response<SearchPlayerResponse>, Status> {
        let q = request.get_ref().q.as_ref().unwrap().to_owned();
        let p = request.get_ref().p.as_ref().unwrap().to_owned();

        let response = match q.source.as_str() {
            "ghin" => {
                let g = Ghin::default();
                g.search_player(0, &self.ghin_token, q.to_owned(), p.to_owned())
                    .await
            }
            _ => Err(anyhow!("unknown handicap source: '{}'", q.source)),
        };

        match response {
            Ok(r) => Ok(Response::new(r)),
            Err(e) => {
                error!("{:?} for {:#?}: {:#?}", e, q, p);
                Err(Status::new(Code::Unknown, e.to_string()))
            }
        }
    }

    async fn request_gpa(
        &self,
        request: Request<GpaRequest>,
    ) -> Result<Response<GpaResponse>, Status> {
        let source = request.get_ref().source.to_owned();
        let id = request.get_ref().golfer_id.to_owned();
        let email = request.get_ref().email.to_owned();

        let response = match source.as_str() {
            "ghin" => {
                let g = Ghin::default();
                g.request_gpa(0, &self.ghin_token, id.to_owned(), email.to_owned())
                    .await
            }
            _ => Err(anyhow!("unknown handicap source: '{}'", source)),
        };

        match response {
            Ok(r) => Ok(Response::new(r)),
            Err(e) => {
                error!("{:?} for {:#?}: {:#?}", e, id, email);
                Err(Status::new(Code::Unknown, e.to_string()))
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    env_logger::init();

    let addr = "[::1]:50051".parse().unwrap();
    let hdcp = HandicapService::default();

    let reflection_service = tonic_reflection::server::Builder::configure()
        .register_encoded_file_descriptor_set(handicap::FILE_DESCRIPTOR_SET)
        .build()
        .unwrap();

    info!("Handicap service listening on {}", addr);

    Server::builder()
        .add_service(HandicapServer::new(hdcp))
        .add_service(reflection_service)
        .serve(addr)
        .await?;

    Ok(())
}
