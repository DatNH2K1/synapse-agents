import { describe, it, expect, vi, beforeEach } from "vitest";
import { useI18n, I18nProvider } from "@/lib/i18n";
import en from "@/locales/en.json";

// We mock react hooks specifically for the i18n tests
const mockSetLocale = vi.fn();
let mockContextValue: ReturnType<typeof useI18n> | null = null;

vi.mock("react", async () => {
  const actual = (await vi.importActual("react")) as Record<
    string,
    object | (() => void)
  >;
  return {
    ...actual,
    useContext: vi.fn(() => mockContextValue),
    useState: vi.fn((init) => [init, mockSetLocale]),
  };
});

describe("lib/i18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = null;
  });

  it("should throw error if useI18n is used outside I18nProvider", () => {
    mockContextValue = null;
    expect(() => {
      useI18n();
    }).toThrow("useI18n must be used within I18nProvider");
  });

  it("should return context value when useI18n is inside I18nProvider", () => {
    mockContextValue = { locale: "en", t: vi.fn(), setLocale: vi.fn() };
    const val = useI18n();
    expect(val.locale).toBe("en");
  });

  it("should render provider and translate properly with key interpolation", () => {
    // Manually run I18nProvider function to test its children and Context values
    const providerNode = I18nProvider({ children: "child-content" });
    expect(providerNode.props.children).toBe("child-content");

    const providerValue = providerNode.props.value;
    expect(providerValue.locale).toBe("en");
    expect(typeof providerValue.setLocale).toBe("function");

    // Call setLocale and check if state setter called
    providerValue.setLocale("vi");
    expect(mockSetLocale).toHaveBeenCalledWith("vi");

    // Verify interpolation behavior in translation t function
    const interpolated = providerValue.t("welcome_back", { name: "TestUser" });
    expect(interpolated).toContain("TestUser");

    // Test translating without params
    const noParams = providerValue.t("welcome_back");
    expect(noParams).toBeDefined();

    // Test fallback when key is not found (using a type assertion to simulate missing key)
    const fallback = providerValue.t("non_existent_key" as keyof typeof en);
    expect(fallback).toBe("non_existent_key");
  });
});
