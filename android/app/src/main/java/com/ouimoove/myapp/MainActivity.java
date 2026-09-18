package com.ouimoove.myapp;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

// targetSdkVersion 36 (Android 15+) enforces edge-to-edge display — the
// WebView now draws behind the status/nav bars by default instead of
// Android auto-inserting padding. EdgeToEdge.enable() opts into that
// deliberately.
//
// That alone isn't enough on its own: the WebView doesn't reliably
// forward the consumed system-bar insets into CSS env(safe-area-inset-*)
// (this is what caused the navbar to render distorted/overlapping the
// status bar in production — env() was reporting 0 even though the
// content was genuinely drawing under the status bar). So the insets are
// also applied directly as native padding on the bridge's WebView here,
// which is the one place they're guaranteed to be honored regardless of
// what the WebView reports to CSS.
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
