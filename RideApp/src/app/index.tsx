import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, Ellipse } from "react-native-svg";

const { width, height } = Dimensions.get("window");

function Background() {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      {/* Large soft blobs */}
      <Ellipse cx="-30" cy="60" rx="200" ry="200" fill="#0EA571" fillOpacity="0.07" />
      <Ellipse cx="430" cy="780" rx="200" ry="200" fill="#0EA571" fillOpacity="0.06" />
      <Ellipse cx="420" cy="100" rx="120" ry="120" fill="#0EA571" fillOpacity="0.05" />

      {/* Dot grid — top left */}
      {[40, 80, 120, 160].map(x =>
        [140, 180, 220, 260, 300].map(y => (
          <Circle key={`tl-${x}-${y}`} cx={x} cy={y} r="2" fill="#D1DDD9" fillOpacity="0.9" />
        ))
      )}

      {/* Dot grid — top right */}
      {[250, 290, 330, 370].map(x =>
        [140, 180, 220, 260, 300].map(y => (
          <Circle key={`tr-${x}-${y}`} cx={x} cy={y} r="2" fill="#D1DDD9" fillOpacity="0.9" />
        ))
      )}

      {/* Green accent circles */}
      <Circle cx="44" cy="520" r="5" fill="#0EA571" fillOpacity="0.20" />
      <Circle cx="44" cy="520" r="14" fill="#0EA571" fillOpacity="0.07" />
      <Circle cx="346" cy="460" r="4" fill="#0EA571" fillOpacity="0.18" />
      <Circle cx="346" cy="460" r="11" fill="#0EA571" fillOpacity="0.06" />
      <Circle cx="28" cy="210" r="3" fill="#0EA571" fillOpacity="0.15" />
      <Circle cx="362" cy="170" r="3" fill="#0EA571" fillOpacity="0.15" />
    </Svg>
  );
}

function MapPinIcon() {
  return (
    <Svg width="34" height="34" viewBox="0 0 30 30" fill="none">
      <Path
        d="M15 3C10.6 3 7 6.6 7 11c0 6.5 8 16 8 16s8-9.5 8-16c0-4.4-3.6-8-8-8zm0 10.5c-1.4 0-2.5-1.1-2.5-2.5S13.6 8.5 15 8.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"
        fill="#0EA571"
      />
    </Svg>
  );
}

export default function LandingPage() {
  return (
    <View style={styles.container}>
      <Background />

      {/* Top: logo + headline */}
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <MapPinIcon />
        </View>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>ETRAVO</Text>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Your journey,</Text>
          <Text style={styles.titleAccent}>your control</Text>
        </View>

        <Text style={styles.subtitle}>Driver & Passenger Journey System</Text>
      </View>

      {/* Mid: stats card */}
      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>12k+</Text>
          <Text style={styles.statLabel}>ACTIVE DRIVERS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>98%</Text>
          <Text style={styles.statLabel}>ON-TIME RATE</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>4.9★</Text>
          <Text style={styles.statLabel}>AVG RATING</Text>
        </View>
      </View>

      {/* Bottom: CTA */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("./login")}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>Log in with email</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          By continuing you agree to our{" "}
          <Text style={styles.footerLink}>Terms</Text>
          {" "}&{" "}
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F6",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 28,
  },

  // ── Top ──
  top: {
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E4E9E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(14,165,113,0.10)",
    borderWidth: 1,
    borderColor: "rgba(14,165,113,0.25)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0EA571",
  },
  badgeText: {
    color: "#0EA571",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  titleWrap: {
    alignItems: "center",
    gap: 2,
  },
  title: {
    color: "#1A2B25",
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: "#0EA571",
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#6B7B76",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.2,
    marginTop: 2,
  },

  // ── Stats ──
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  statNum: {
    color: "#1A2B25",
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    color: "#9AA8A4",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: "#E4E9E8",
  },

  // ── Buttons ──
  buttons: {
    alignItems: "center",
    gap: 14,
  },
  loginBtn: {
    backgroundColor: "#0EA571",
    borderRadius: 100,
    paddingVertical: 15,
    paddingHorizontal: 56,
    alignItems: "center",
    shadowColor: "#0EA571",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── Footer ──
  footer: {
    color: "#9AA8A4",
    fontSize: 12,
    textAlign: "center",
  },
  footerLink: {
    color: "#0EA571",
    fontWeight: "600",
  },
});