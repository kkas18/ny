package no.kalkulator.pro;

import android.graphics.Color;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Paints both system bars in the theme's background colour, with icons that read
 * against it. The web view sits between the bars, so the colour goes on the
 * window's decor view as well: from Android 15 the bars are transparent and show
 * whatever is behind them.
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @PluginMethod
    public void paint(PluginCall call) {
        final String hex = call.getString("color", "#11151c");
        final boolean light = Boolean.TRUE.equals(call.getBoolean("light", false));
        final int color;
        try {
            color = Color.parseColor(hex);
        } catch (IllegalArgumentException e) {
            call.reject("Ugyldig farge: " + hex);
            return;
        }
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            window.getDecorView().setBackgroundColor(color);
            window.setStatusBarColor(color);
            window.setNavigationBarColor(color);
            WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(window, window.getDecorView());
            bars.setAppearanceLightStatusBars(light);
            bars.setAppearanceLightNavigationBars(light);
            call.resolve();
        });
    }
}
