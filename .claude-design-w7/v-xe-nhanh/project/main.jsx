/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakSelect,
   HomeScreen, SearchResultsScreen, TripDetailScreen,
   SeatPickerScreen, PassengerInfoScreen, PaymentMethodScreen, PaymentResultScreen,
   MyTicketsScreen, TicketDetailScreen, GuestLookupScreen, GuestCancelScreen,
   ProfileScreen, LoyaltyScreen, LoyaltyHistoryScreen, ComplaintsScreen, ReviewsScreen,
   BlogListScreen, BlogDetailScreen, FAQScreen, OperatorScreen,
   LoginScreen, RegisterScreen, PasswordRecoveryScreen */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "colorEmphasis": "balanced",
  "ticketVariant": "boarding"
}/*EDITMODE-END*/;

const W_DESK = 1440, H_DESK = 980, H_TALL = 1380, H_AUTH = 800;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Keep VxnTweaks global in sync so screens re-render with current tweak.
  window.VxnTweaks = t;

  return (
    <>
      <DesignCanvas>
        <DCSection id="discovery" title="01 · Khám phá & tìm chuyến" subtitle="Hero photo, tìm kiếm, danh sách kết quả, chi tiết chuyến">
          <DCArtboard id="home" label="Trang chủ" width={W_DESK} height={H_TALL}>
            <HomeScreen />
          </DCArtboard>
          <DCArtboard id="search" label="Kết quả tìm chuyến" width={W_DESK} height={H_DESK}>
            <SearchResultsScreen />
          </DCArtboard>
          <DCArtboard id="trip" label="Chi tiết chuyến" width={W_DESK} height={H_TALL}>
            <TripDetailScreen />
          </DCArtboard>
          <DCArtboard id="operator" label="Trang nhà xe" width={W_DESK} height={H_TALL}>
            <OperatorScreen />
          </DCArtboard>
        </DCSection>

        <DCSection id="booking" title="02 · Đặt vé" subtitle="Sơ đồ ghế sleeper, thông tin hành khách, thanh toán">
          <DCArtboard id="seats" label="Chọn ghế · sleeper 2 tầng" width={W_DESK} height={H_DESK}>
            <SeatPickerScreen />
          </DCArtboard>
          <DCArtboard id="passenger" label="Thông tin hành khách" width={W_DESK} height={H_TALL}>
            <PassengerInfoScreen />
          </DCArtboard>
          <DCArtboard id="payment" label="Phương thức thanh toán" width={W_DESK} height={H_DESK}>
            <PaymentMethodScreen />
          </DCArtboard>
          <DCArtboard id="payment-results" label="Kết quả thanh toán · 3 trạng thái" width={W_DESK} height={780}>
            <PaymentResultScreen />
          </DCArtboard>
        </DCSection>

        <DCSection id="tickets" title="03 · Vé của tôi" subtitle="Danh sách vé, chi tiết & QR — biến thể trong Tweaks">
          <DCArtboard id="my-tickets" label="Vé của tôi" width={W_DESK} height={H_TALL}>
            <MyTicketsScreen />
          </DCArtboard>
          <DCArtboard id="ticket-detail" label={`Chi tiết vé · variant "${t.ticketVariant}"`} width={W_DESK} height={H_TALL}>
            <TicketDetailScreen />
          </DCArtboard>
          <DCArtboard id="guest-lookup" label="Tra cứu vé khách · OTP" width={W_DESK} height={H_DESK}>
            <GuestLookupScreen />
          </DCArtboard>
          <DCArtboard id="guest-cancel" label="Huỷ vé khách" width={W_DESK} height={H_DESK}>
            <GuestCancelScreen />
          </DCArtboard>
        </DCSection>

        <DCSection id="account" title="04 · Tài khoản & VXN Plus" subtitle="Profile, loyalty, complaints, reviews">
          <DCArtboard id="profile" label="Hồ sơ tài khoản" width={W_DESK} height={H_TALL}>
            <ProfileScreen />
          </DCArtboard>
          <DCArtboard id="loyalty" label="VXN Plus · hạng thành viên" width={W_DESK} height={H_TALL}>
            <LoyaltyScreen />
          </DCArtboard>
          <DCArtboard id="loyalty-history" label="Lịch sử điểm" width={W_DESK} height={H_DESK}>
            <LoyaltyHistoryScreen />
          </DCArtboard>
          <DCArtboard id="complaints" label="Khiếu nại của tôi" width={W_DESK} height={H_DESK}>
            <ComplaintsScreen />
          </DCArtboard>
          <DCArtboard id="reviews" label="Đánh giá của tôi" width={W_DESK} height={H_DESK}>
            <ReviewsScreen />
          </DCArtboard>
        </DCSection>

        <DCSection id="content" title="05 · Cẩm nang, FAQ" subtitle="Blog, tin tức, câu hỏi thường gặp">
          <DCArtboard id="blog" label="Cẩm nang & tin tức" width={W_DESK} height={H_TALL}>
            <BlogListScreen />
          </DCArtboard>
          <DCArtboard id="blog-detail" label="Bài viết chi tiết" width={W_DESK} height={H_TALL}>
            <BlogDetailScreen />
          </DCArtboard>
          <DCArtboard id="faq" label="Câu hỏi thường gặp" width={W_DESK} height={H_TALL}>
            <FAQScreen />
          </DCArtboard>
        </DCSection>

        <DCSection id="auth" title="06 · Auth flows" subtitle="Đăng nhập, đăng ký, khôi phục mật khẩu">
          <DCArtboard id="login" label="Đăng nhập" width={W_DESK} height={H_AUTH}>
            <LoginScreen />
          </DCArtboard>
          <DCArtboard id="register" label="Đăng ký" width={W_DESK} height={H_AUTH}>
            <RegisterScreen />
          </DCArtboard>
          <DCArtboard id="recovery" label="Quên · đặt lại · xác thực" width={W_DESK} height={H_AUTH}>
            <PasswordRecoveryScreen />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual direction" />
        <TweakRadio
          label="Color emphasis"
          value={t.colorEmphasis}
          options={[
            { value: 'teal',     label: 'Teal' },
            { value: 'balanced', label: 'Cân bằng' },
            { value: 'saffron',  label: 'Saffron' },
          ]}
          onChange={(v) => setTweak('colorEmphasis', v)}
        />

        <TweakSection label="Ticket card design" />
        <TweakSelect
          label="Variant"
          value={t.ticketVariant}
          options={[
            { value: 'boarding', label: 'Boarding pass (teal, perforated)' },
            { value: 'classic',  label: 'Classic (light, balanced)' },
            { value: 'saffron',  label: 'Saffron (warm gradient)' },
            { value: 'minimal',  label: 'Minimal (editorial, black/white)' },
          ]}
          onChange={(v) => setTweak('ticketVariant', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
