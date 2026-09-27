package no.kalkulator.pro;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Larger system text makes the app larger too, up to 130 % so the keypad still fits. */
    private static final float MAX_TEXT_SCALE = 1.3f;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SystemBarsPlugin.class);
        super.onCreate(savedInstanceState);
        applyTextScale();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyTextScale();
    }

    private void applyTextScale() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        float scale = Math.min(getResources().getConfiguration().fontScale, MAX_TEXT_SCALE);
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setTextZoom(Math.round(scale * 100));
    }
}
