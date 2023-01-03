use anyhow::Result;
use std::fmt::{Display, Formatter};

/// This struct contains a token and getter/setter methods.
pub struct Token {
    // this field contains the JWT
    token: tokio::sync::RwLock<DefaultTokenData>,
}

#[derive(Debug, Clone)]
pub struct DefaultTokenData(String);

impl Display for DefaultTokenData {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Default for Token {
    fn default() -> Self {
        Self::new()
    }
}

impl Token {
    pub(crate) fn new() -> Self {
        Self {
            token: tokio::sync::RwLock::new(DefaultTokenData("".to_string())),
        }
    }

    pub(crate) async fn token(&self) -> String {
        self.token.read().await.clone().to_string()
    }

    pub(crate) async fn set_token(&self, token: String) -> Result<()> {
        *self.token.write().await = DefaultTokenData(token);
        Ok(())
    }
}
