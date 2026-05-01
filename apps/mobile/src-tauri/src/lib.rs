use tauri::{webview::WebviewWindowBuilder, WebviewUrl};
use url::Url;

const DEFAULT_WEB_URL: &str = "http://localhost:3000/";
const WINDOW_LABEL: &str = "main";
const WINDOW_TITLE: &str = "短剧速看";
const BUILD_WEB_URL: Option<&str> = option_env!("NOVELQUICK_WEB_URL");

fn resolve_web_url() -> String {
    let web_url = std::env::var("NOVELQUICK_WEB_URL")
        .ok()
        .filter(|url| !url.trim().is_empty())
        .or_else(|| BUILD_WEB_URL.map(str::to_owned))
        .unwrap_or_else(|| DEFAULT_WEB_URL.to_string());

    rewrite_dev_host(web_url)
}

/// Tauri sets TAURI_DEV_HOST to the host machine's LAN IP when running on a
/// device via `tauri android dev` / `tauri ios dev`. Replace localhost so the
/// device can actually reach the Next.js dev server.
fn rewrite_dev_host(web_url: String) -> String {
    let Ok(dev_host) = std::env::var("TAURI_DEV_HOST") else {
        return web_url;
    };

    let Ok(mut parsed) = Url::parse(&web_url) else {
        return web_url;
    };

    let Some(host) = parsed.host_str() else {
        return web_url;
    };

    if host != "localhost" && host != "127.0.0.1" {
        return web_url;
    }

    if parsed.set_host(Some(&dev_host)).is_err() {
        return web_url;
    }

    parsed.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window_url = WebviewUrl::External(
                resolve_web_url()
                    .parse()
                    .expect("NOVELQUICK_WEB_URL must be a valid absolute URL"),
            );

            let mut builder =
                WebviewWindowBuilder::new(app, WINDOW_LABEL, window_url)
                    .user_agent("NovelQuick/1.0");

            #[cfg(not(mobile))]
            {
                builder = builder
                    .title(WINDOW_TITLE)
                    .inner_size(430.0, 900.0)
                    .min_inner_size(375.0, 600.0);
            }

            builder.build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
