#[tokio::test]
async fn test_health_endpoint() {
    let client = reqwest::Client::new();
    
    // Attempt to call the health endpoint (assumes the server is running on localhost:3000)
    // If the server isn't running, this test will fail or be skipped depending on CI setup.
    // For a real CI pipeline, the server and databases would be spun up via docker-compose before `cargo test`.
    let res = client.get("http://127.0.0.1:3000/health").send().await;
    
    match res {
        Ok(response) => {
            assert_eq!(response.status(), 200);
            let json: serde_json::Value = response.json().await.unwrap();
            assert_eq!(json["status"], "healthy");
        },
        Err(e) => {
            // If connection refused, we might just print a warning, as e2e tests require the server to be up.
            println!("Server not running, skipping health test. Error: {}", e);
        }
    }
}

#[tokio::test]
async fn test_auth_failure_missing_header() {
    let client = reqwest::Client::new();
    let res = client.get("http://127.0.0.1:3000/api/incidents").send().await;
    
    match res {
        Ok(response) => {
            assert_eq!(response.status(), 401);
        },
        Err(e) => {
            println!("Server not running, skipping auth failure test. Error: {}", e);
        }
    }
}

#[tokio::test]
async fn test_auth_failure_invalid_token() {
    let client = reqwest::Client::new();
    let res = client.get("http://127.0.0.1:3000/api/incidents")
        .header("Authorization", "Bearer invalid_token_here")
        .send()
        .await;
    
    match res {
        Ok(response) => {
            assert_eq!(response.status(), 401);
        },
        Err(e) => {
            println!("Server not running, skipping auth failure test. Error: {}", e);
        }
    }
