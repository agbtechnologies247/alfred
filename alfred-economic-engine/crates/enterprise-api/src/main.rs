use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    tracing::info!("Starting A.L.F.R.E.D. Enterprise Economics Engine (E³)...");
    
    let app = enterprise_api::app_router();
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3005));
    tracing::info!("E³ REST API listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
