package com.ouimoove.myapp;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

// targetSdkVersion 36 (Android 15+) enforces edge-to-edge display — the
// WebView now draws behind the status/nav bars by default instead of
// Android auto-inserting padding. EdgeToEdge.enable() opts into that
// deliberately; the CSS side (src/index.css) adds safe-area-inset padding
// so real content doesn't sit under the system bars.
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
