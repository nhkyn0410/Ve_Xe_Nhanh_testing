/* global React, Frame, PageTopUtility, Btn, Chip, Card, Icon, VND, OPERATORS, SAMPLE_TRIPS, USER, Amenity, PageHeader, vxnAccent */

// ============================================================
//  MY TICKETS — /my/tickets
// ============================================================
const MY_TICKETS = [
  {
    id: "tk1",
    code: "VXN-AB7K-2401",
    status: "valid",
    kind: "upcoming",
    operator: OPERATORS[2],
    busType: "Limousine VIP",
    plate: "30H-468.91",
    from: "Hà Nội",
    fromAt: "08:15",
    fromStation: "VP Trần Duy Hưng",
    to: "Sapa",
    toAt: "13:30",
    toStation: "VP Cầu Mây",
    date: "Thứ 6, 15 tháng 5, 2026",
    seats: ["B02", "C02"],
    passengers: 2,
    total: 899100,
    paid: true,
    departsIn: "Còn 2 ngày",
  },
  {
    id: "tk2",
    code: "VXN-PD9N-1893",
    status: "valid",
    kind: "upcoming",
    operator: OPERATORS[0],
    busType: "Limousine cabin",
    plate: "29B-841.20",
    from: "Hà Nội",
    fromAt: "14:00",
    fromStation: "BX Mỹ Đình",
    to: "Hạ Long",
    toAt: "17:30",
    toStation: "TT Hạ Long",
    date: "Chủ nhật, 24 tháng 5, 2026",
    seats: ["A04"],
    passengers: 1,
    total: 280000,
    paid: true,
    departsIn: "Còn 11 ngày",
  },
  {
    id: "tk3",
    code: "VXN-XY4M-0238",
    status: "used",
    kind: "past",
    operator: OPERATORS[3],
    busType: "Giường nằm 40 chỗ",
    plate: "51B-672.04",
    from: "TP. Hồ Chí Minh",
    fromAt: "22:00",
    fromStation: "BX Miền Đông",
    to: "Đà Lạt",
    toAt: "05:30",
    toStation: "BX Đà Lạt",
    date: "Thứ 5, 24 tháng 4, 2026",
    seats: ["L17"],
    passengers: 1,
    total: 295000,
    paid: true,
    departsIn: "Đã đi · cách đây 21 ngày",
  },
  {
    id: "tk4",
    code: "VXN-CE3R-9921",
    status: "cancelled",
    kind: "cancelled",
    operator: OPERATORS[1],
    busType: "Limousine 22 chỗ",
    plate: "60E-128.45",
    from: "TP. Hồ Chí Minh",
    fromAt: "07:30",
    fromStation: "BX Miền Tây",
    to: "Vũng Tàu",
    toAt: "09:45",
    toStation: "TT Vũng Tàu",
    date: "Thứ 7, 12 tháng 4, 2026",
    seats: ["B07"],
    passengers: 1,
    total: 145000,
    paid: false,
    refund: 130500,
    departsIn: "Đã huỷ · hoàn 130,500đ",
  },
];

function MyTicketsScreen() {
  return (
    <Frame active="trips" signedIn>
      <PageTopUtility crumbs={["Trang chủ", "Hành trình của tôi"]} />
      <PageHeader
        title="Vé của tôi"
        subtitle="Quản lý tất cả vé đã đặt qua Vé Xe Nhanh."
        back={false}
        right={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn kind="ghost" icon="qr">
              Tra cứu vé khách
            </Btn>
            <Btn kind="primary" icon="plus">
              Đặt vé mới
            </Btn>
          </div>
        }
      />

      {/* Tabs */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid var(--vxn-border)",
          padding: "0 32px",
          display: "flex",
          gap: 0,
        }}
      >
        {[
          ["upcoming", "Sắp tới", 2, true],
          ["past", "Đã đi", 14, false],
          ["cancelled", "Đã huỷ", 1, false],
          ["all", "Tất cả", 17, false],
        ].map(([k, l, n, on]) => (
          <button
            key={k}
            style={{
              padding: "14px 18px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              borderBottom: `2px solid ${on ? vxnAccent() : "transparent"}`,
              color: on ? "var(--vxn-ink)" : "var(--vxn-fg-3)",
              font: `${on ? 600 : 500} 14px var(--font-display)`,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {l}
            <span
              style={{
                minWidth: 22,
                height: 22,
                padding: "0 7px",
                borderRadius: 999,
                background: on ? vxnAccent() : "var(--vxn-bg-cloud)",
                color: on ? "#fff" : "var(--vxn-fg-3)",
                display: "grid",
                placeItems: "center",
                font: "600 11px var(--font-display)",
              }}
            >
              {n}
            </span>
          </button>
        ))}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 12px",
              height: 36,
              border: "1px solid var(--vxn-border)",
              borderRadius: 8,
              font: "400 13px var(--font-display)",
              color: "var(--vxn-fg-3)",
            }}
          >
            <Icon name="search" size={14} color="var(--vxn-fg-5)" />
            <span>Tìm mã vé hoặc tuyến</span>
          </div>
          <Btn kind="ghost" icon="filter" size="sm">
            Lọc
          </Btn>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Upcoming summary band */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: 14,
            background:
              "linear-gradient(110deg, var(--vxn-teal-800) 0%, var(--vxn-teal-700) 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,.15)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="bus" size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                font: "500 12px var(--font-display)",
                color: "var(--vxn-saffron-500)",
                letterSpacing: ".06em",
                marginBottom: 4,
              }}
            >
              CHUYẾN GẦN NHẤT · 2 NGÀY NỮA
            </div>
            <div style={{ font: "600 18px var(--font-display)" }}>
              Hà Nội → Sapa · {MY_TICKETS[0].operator.name}
            </div>
            <div
              style={{
                font: "400 13px var(--font-display)",
                color: "rgba(255,255,255,.75)",
                marginTop: 2,
              }}
            >
              {MY_TICKETS[0].date} · {MY_TICKETS[0].fromAt} · Ghế{" "}
              {MY_TICKETS[0].seats.join(", ")}
            </div>
          </div>
          <Btn kind="saffron">Xem QR vé →</Btn>
        </div>

        {MY_TICKETS.filter((t) => t.kind === "upcoming" || t.kind === "past")
          .slice(0, 3)
          .map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        <TicketRow ticket={MY_TICKETS[3]} />
      </div>
    </Frame>
  );
}

function TicketRow({ ticket }) {
  const statusToTone = {
    valid: "success",
    used: "neutral",
    cancelled: "danger",
  };
  const statusLabel = {
    valid: "CÒN HIỆU LỰC",
    used: "ĐÃ DÙNG",
    cancelled: "ĐÃ HUỶ",
  };
  const accent = vxnAccent();
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--vxn-border)",
        borderRadius: 14,
        display: "grid",
        gridTemplateColumns: "4px 1fr 220px",
      }}
    >
      <div
        style={{
          background:
            ticket.status === "cancelled"
              ? "var(--vxn-danger-fg)"
              : ticket.status === "used"
                ? "var(--vxn-fg-4)"
                : accent,
          borderRadius: "14px 0 0 14px",
        }}
      />
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: ticket.operator.color,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              font: "700 13px var(--font-display)",
            }}
          >
            {ticket.operator.short}
          </div>
          <div>
            <div
              style={{
                font: "600 15px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              {ticket.operator.name}
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {ticket.busType} · {ticket.plate}
            </div>
          </div>
          <span
            style={{
              marginLeft: "auto",
              font: "500 12px var(--font-mono)",
              color: "var(--vxn-fg-3)",
              letterSpacing: ".04em",
            }}
          >
            {ticket.code}
          </span>
          <Chip tone={statusToTone[ticket.status]}>
            {statusLabel[ticket.status]}
          </Chip>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div>
            <div
              style={{
                font: "500 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
                letterSpacing: ".05em",
              }}
            >
              {ticket.fromAt}
            </div>
            <div
              style={{
                font: "700 22px var(--font-display)",
                color: "var(--vxn-ink)",
                lineHeight: 1.1,
              }}
            >
              {ticket.from}
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
                marginTop: 2,
              }}
            >
              {ticket.fromStation}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {ticket.date}
            </div>
            <div
              style={{
                width: "100%",
                height: 2,
                background: "var(--vxn-bg-fog)",
                position: "relative",
                margin: "6px 0",
              }}
            >
              <Icon
                name="bus"
                size={14}
                color={accent}
                style={{
                  position: "absolute",
                  top: -6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#fff",
                  padding: "0 4px",
                }}
              />
            </div>
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {ticket.departsIn}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                font: "500 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
                letterSpacing: ".05em",
              }}
            >
              {ticket.toAt}
            </div>
            <div
              style={{
                font: "700 22px var(--font-display)",
                color: "var(--vxn-ink)",
                lineHeight: 1.1,
              }}
            >
              {ticket.to}
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
                marginTop: 2,
              }}
            >
              {ticket.toStation}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 12,
            borderTop: "1px dashed var(--vxn-border)",
          }}
        >
          <span
            style={{
              font: "400 12px var(--font-display)",
              color: "var(--vxn-fg-3)",
            }}
          >
            <strong style={{ color: "var(--vxn-ink)" }}>
              {ticket.passengers}
            </strong>{" "}
            hành khách · ghế{" "}
            <strong style={{ color: "var(--vxn-ink)" }}>
              {ticket.seats.join(", ")}
            </strong>
          </span>
          {ticket.status === "cancelled" && (
            <Chip tone="success" icon="refresh">
              Hoàn {VND(ticket.refund)} đang xử lý
            </Chip>
          )}
        </div>
      </div>

      <div
        style={{
          background: "var(--vxn-bg-soft)",
          borderLeft: "1px dashed var(--vxn-border)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            font: "700 22px var(--font-display)",
            color: "var(--vxn-ink)",
          }}
        >
          {VND(ticket.total)}
        </div>
        <div
          style={{
            font: "400 11px var(--font-display)",
            color: "var(--vxn-fg-5)",
            marginBottom: 8,
          }}
        >
          {ticket.paid ? "Đã thanh toán" : "Chưa thanh toán"}
        </div>
        {ticket.status === "valid" && (
          <>
            <Btn kind="primary" size="sm" style={{ width: "100%" }}>
              Xem QR vé
            </Btn>
            <Btn kind="ghost" size="sm" style={{ width: "100%" }}>
              Huỷ vé
            </Btn>
          </>
        )}
        {ticket.status === "used" && (
          <>
            <Btn kind="ghost" size="sm" style={{ width: "100%" }}>
              Đặt lại chuyến này
            </Btn>
            <Btn kind="ghost" size="sm" style={{ width: "100%" }} icon="star">
              Đánh giá chuyến
            </Btn>
          </>
        )}
        {ticket.status === "cancelled" && (
          <>
            <Btn kind="ghost" size="sm" style={{ width: "100%" }}>
              Theo dõi hoàn tiền
            </Btn>
            <Btn kind="primary" size="sm" style={{ width: "100%" }}>
              Đặt vé lại
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  TICKET DETAIL — 4 variants for the tweak
// ============================================================
function TicketDetailScreen() {
  const t = MY_TICKETS[0];
  const variant = window.VxnTweaks?.ticketVariant || "boarding";
  return (
    <Frame active="trips" signedIn>
      <PageTopUtility
        crumbs={["Trang chủ", "Vé của tôi", "Hà Nội → Sapa", t.code]}
      />
      <PageHeader
        title={`Vé · ${t.from} → ${t.to}`}
        subtitle={`${t.date} · ${t.fromAt} → ${t.toAt} · Mã ${t.code}`}
        right={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn kind="ghost" icon="share">
              Chia sẻ
            </Btn>
            <Btn kind="ghost" icon="download">
              Tải PDF
            </Btn>
            <Btn kind="ghost" icon="mail">
              Gửi lại email
            </Btn>
            <Btn kind="danger">Huỷ vé</Btn>
          </div>
        }
      />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* The ticket variant */}
          {variant === "classic" && <TicketCardClassic t={t} />}
          {variant === "boarding" && <TicketCardBoarding t={t} />}
          {variant === "saffron" && <TicketCardSaffron t={t} />}
          {variant === "minimal" && <TicketCardMinimal t={t} />}

          {/* Below: itinerary timeline */}
          <Card padding={24}>
            <h3
              style={{
                margin: "0 0 14px",
                font: "600 16px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              Hành trình chi tiết
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
                paddingLeft: 26,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  top: 12,
                  bottom: 12,
                  width: 2,
                  background: "var(--vxn-bg-fog)",
                }}
              />
              {[
                ["08:15", "Khởi hành Hà Nội", "VP Trần Duy Hưng", true],
                ["11:00", "Nghỉ Lào Cai", "BX Trung tâm · 20 phút", false],
                ["13:30", "Đến Sapa", "VP Cầu Mây", true],
              ].map(([t, n, s, big], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    paddingBottom: i === 2 ? 0 : 16,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -20,
                      top: 3,
                      width: big ? 16 : 12,
                      height: big ? 16 : 12,
                      borderRadius: "50%",
                      background: big ? vxnAccent() : "#fff",
                      border: `2px solid ${vxnAccent()}`,
                    }}
                  />
                  <span
                    style={{
                      minWidth: 56,
                      font: "700 13px var(--font-display)",
                      color: "var(--vxn-ink)",
                    }}
                  >
                    {t}
                  </span>
                  <div>
                    <div
                      style={{
                        font: "500 14px var(--font-display)",
                        color: "var(--vxn-ink)",
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        font: "400 12px var(--font-display)",
                        color: "var(--vxn-fg-5)",
                      }}
                    >
                      {s}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding={24}>
            <h3
              style={{
                margin: "0 0 14px",
                font: "600 16px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              Quy định lên xe
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                font: "400 13px var(--font-display)",
                color: "var(--vxn-fg-2)",
                lineHeight: 1.75,
              }}
            >
              <li>
                Có mặt tại điểm đón trước giờ khởi hành <strong>15 phút</strong>
                .
              </li>
              <li>Mang theo CMND/CCCD khớp với tên trên vé.</li>
              <li>Hành lý tối đa 20kg, kích thước tối đa 60×40×25cm.</li>
              <li>Không mang vật dễ cháy nổ, gia súc, gia cầm.</li>
            </ul>
          </Card>
        </div>

        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            position: "sticky",
            top: 24,
            alignSelf: "flex-start",
          }}
        >
          <Card padding={20}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Icon name="phone" size={18} color="var(--vxn-teal-700)" />
              <span
                style={{
                  font: "600 15px var(--font-display)",
                  color: "var(--vxn-ink)",
                }}
              >
                Liên hệ nhà xe
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                font: "400 13px var(--font-display)",
                color: "var(--vxn-fg-2)",
              }}
            >
              <div>
                Hotline: <strong>0888 123 456</strong>
              </div>
              <div>
                Zalo: <strong>tamhanh.vn</strong>
              </div>
              <div>
                Tài xế (T6, 15/05):{" "}
                <strong>Nguyễn Văn Hùng · 0901 882 401</strong>
              </div>
            </div>
            <Btn
              kind="ghost"
              style={{ marginTop: 14, width: "100%" }}
              icon="phone"
            >
              Gọi nhà xe
            </Btn>
          </Card>
          <Card padding={20}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Icon name="map" size={18} color="var(--vxn-teal-700)" />
              <span
                style={{
                  font: "600 15px var(--font-display)",
                  color: "var(--vxn-ink)",
                }}
              >
                Bản đồ điểm đón
              </span>
            </div>
            <div
              style={{
                height: 160,
                borderRadius: 10,
                background: "linear-gradient(135deg, #DCE6F1 0%, #F4EFE6 100%)",
                border: "1px solid var(--vxn-border)",
                position: "relative",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 12px)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon
                  name="markerDep"
                  size={30}
                  color="var(--vxn-saffron-700)"
                />
                <span
                  style={{
                    font: "500 12px var(--font-display)",
                    color: "var(--vxn-ink)",
                    background: "#fff",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  VP Trần Duy Hưng
                </span>
              </span>
            </div>
            <Btn kind="ghost" style={{ marginTop: 12, width: "100%" }}>
              Chỉ đường (Google Maps)
            </Btn>
          </Card>
          <Card padding={20}>
            <h3
              style={{
                margin: "0 0 12px",
                font: "600 15px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              Tiện ích trên xe
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {["wifi", "ac", "power", "water", "tv", "toilet"].map((a) => (
                <Amenity key={a} kind={a} withLabel />
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </Frame>
  );
}

// ── Ticket card variant: CLASSIC
function TicketCardClassic({ t }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--vxn-border)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 6px 24px -8px rgba(0,40,60,.12)",
        display: "grid",
        gridTemplateColumns: "1fr 260px",
      }}
    >
      <div
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: t.operator.color,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              font: "700 16px var(--font-display)",
            }}
          >
            {t.operator.short}
          </div>
          <div>
            <div
              style={{
                font: "600 16px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              {t.operator.name}
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {t.busType} · BS {t.plate}
            </div>
          </div>
          <Chip tone="success" style={{ marginLeft: "auto" }}>
            <Icon name="check" size={11} /> CÒN HIỆU LỰC
          </Chip>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
          <div>
            <div
              style={{
                font: "500 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
                letterSpacing: ".06em",
              }}
            >
              KHỞI HÀNH
            </div>
            <div
              style={{
                font: "700 36px var(--font-display)",
                color: "var(--vxn-ink)",
                letterSpacing: "-.02em",
                lineHeight: 1,
              }}
            >
              {t.fromAt}
            </div>
            <div
              style={{
                font: "600 18px var(--font-display)",
                color: "var(--vxn-ink)",
                marginTop: 4,
              }}
            >
              {t.from}
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {t.fromStation}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              paddingBottom: 4,
            }}
          >
            <Icon name="bus" size={20} color={vxnAccent()} />
            <span
              style={{
                font: "500 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              5h 15
            </span>
            <span
              style={{
                width: "90%",
                height: 2,
                background: "var(--vxn-bg-fog)",
              }}
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                font: "500 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
                letterSpacing: ".06em",
              }}
            >
              ĐẾN NƠI
            </div>
            <div
              style={{
                font: "700 36px var(--font-display)",
                color: "var(--vxn-ink)",
                letterSpacing: "-.02em",
                lineHeight: 1,
              }}
            >
              {t.toAt}
            </div>
            <div
              style={{
                font: "600 18px var(--font-display)",
                color: "var(--vxn-ink)",
                marginTop: 4,
              }}
            >
              {t.to}
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {t.toStation}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            padding: "16px 0",
            borderTop: "1px dashed var(--vxn-border-strong)",
            borderBottom: "1px dashed var(--vxn-border-strong)",
          }}
        >
          <DataPair label="NGÀY" value={t.date} />
          <DataPair label="HÀNH KHÁCH" value={`${t.passengers} người`} />
          <DataPair label="GHẾ" value={t.seats.join(", ")} />
          <DataPair label="TỔNG" value={VND(t.total)} accent />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              font: "500 11px var(--font-display)",
              color: "var(--vxn-fg-5)",
              letterSpacing: ".06em",
            }}
          >
            MÃ ĐẶT VÉ
          </div>
          <span
            style={{
              font: "700 17px var(--font-mono)",
              color: "var(--vxn-ink)",
              letterSpacing: ".06em",
            }}
          >
            {t.code}
          </span>
        </div>
      </div>
      <div
        style={{
          background: "var(--vxn-bg-soft)",
          borderLeft: "2px dashed var(--vxn-border-strong)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          justifyContent: "center",
          position: "relative",
        }}
      >
        <PerforationDots side="left" />
        <QRBox label={t.code} />
        <div
          style={{
            font: "500 12px var(--font-display)",
            color: "var(--vxn-fg-3)",
            textAlign: "center",
          }}
        >
          Quét QR tại điểm đón
          <br />
          để xác nhận lên xe
        </div>
      </div>
    </div>
  );
}

// ── Ticket card variant: BOARDING PASS (perforated, two-tone)
function TicketCardBoarding({ t }) {
  const accent = vxnAccent();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 12px 32px -10px rgba(0,40,60,.18)",
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--vxn-teal-800) 0%, var(--vxn-teal-700) 100%)",
          color: "#fff",
          padding: "24px 28px 0",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(255,255,255,.12)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 19 12 4l9 15M8 13l4-6 4 6M12 7v12"
                stroke="var(--vxn-saffron-500)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            style={{
              font: "700 14px var(--font-display)",
              color: "var(--vxn-saffron-500)",
              letterSpacing: ".06em",
            }}
          >
            VÉ XE NHANH · BOARDING PASS
          </span>
          <Chip
            tone="ink"
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,.18)",
              color: "#fff",
            }}
          >
            {t.operator.name}
          </Chip>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 32,
            paddingBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                font: "500 11px var(--font-display)",
                color: "rgba(255,255,255,.6)",
                letterSpacing: ".08em",
              }}
            >
              FROM
            </div>
            <div
              style={{
                font: "700 48px var(--font-display)",
                letterSpacing: "-.02em",
                lineHeight: 0.9,
                marginTop: 4,
              }}
            >
              HAN
            </div>
            <div style={{ font: "500 13px var(--font-display)", marginTop: 6 }}>
              {t.from}
            </div>
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "rgba(255,255,255,.6)",
              }}
            >
              {t.fromStation}
            </div>
          </div>
          <div style={{ flex: 1, position: "relative", paddingBottom: 4 }}>
            <svg
              width="100%"
              height="40"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
            >
              <path
                d="M2 30 Q 100 0 198 30"
                stroke="rgba(255,255,255,.4)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="3 5"
              />
            </svg>
            <Icon
              name="bus"
              size={20}
              color="var(--vxn-saffron-500)"
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                font: "500 11px var(--font-display)",
                color: "rgba(255,255,255,.6)",
                letterSpacing: ".08em",
              }}
            >
              TO
            </div>
            <div
              style={{
                font: "700 48px var(--font-display)",
                letterSpacing: "-.02em",
                lineHeight: 0.9,
                marginTop: 4,
              }}
            >
              SPA
            </div>
            <div style={{ font: "500 13px var(--font-display)", marginTop: 6 }}>
              {t.to}
            </div>
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "rgba(255,255,255,.6)",
              }}
            >
              {t.toStation}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            padding: "20px 0",
            borderTop: "1px solid rgba(255,255,255,.18)",
          }}
        >
          <BPDataPair label="DEPART" value={t.fromAt} />
          <BPDataPair label="ARRIVE" value={t.toAt} />
          <BPDataPair label="DATE" value="15/05/26" />
          <BPDataPair label="SEAT" value={t.seats.join(" · ")} highlight />
        </div>

        <div
          style={{
            paddingBottom: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <BPDataPair label="PASSENGER" value={USER.fullName} />
          <BPDataPair label="BUS" value={t.busType} />
          <BPDataPair label="PLATE" value={t.plate} />
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          justifyContent: "center",
          position: "relative",
        }}
      >
        <PerforationDots side="left" colorDark />
        <span
          style={{
            font: "500 11px var(--font-display)",
            color: "var(--vxn-fg-5)",
            letterSpacing: ".08em",
          }}
        >
          BOARDING PASS
        </span>
        <QRBox label={t.code} />
        <span
          style={{
            font: "700 13px var(--font-mono)",
            color: "var(--vxn-ink)",
            letterSpacing: ".06em",
          }}
        >
          {t.code}
        </span>
        <span
          style={{
            font: "400 11px var(--font-display)",
            color: "var(--vxn-fg-5)",
            textAlign: "center",
          }}
        >
          Quét QR tại điểm đón
        </span>
      </div>
    </div>
  );
}

// ── Ticket card variant: SAFFRON
function TicketCardSaffron({ t }) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #FFF6E2 0%, #FFE9C4 60%, #FFD9A0 100%)",
        border: "1px solid #F2C677",
        boxShadow: "0 12px 30px -10px rgba(232,155,38,.4)",
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(243,177,50,.5), transparent 70%)",
        }}
      />
      <div
        style={{
          padding: 28,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="ticket" size={22} color="var(--vxn-saffron-700)" />
          </div>
          <div>
            <div
              style={{
                font: "700 14px var(--font-display)",
                color: "var(--vxn-saffron-700)",
                letterSpacing: ".06em",
              }}
            >
              VÉ XE NHANH
            </div>
            <div
              style={{
                font: "400 12px var(--font-display)",
                color: "var(--vxn-fg-3)",
              }}
            >
              Vé chuyến · {t.operator.name}
            </div>
          </div>
          <Chip
            style={{
              marginLeft: "auto",
              background: "var(--vxn-success-leaf)",
              color: "#fff",
            }}
          >
            SẴN SÀNG ĐI
          </Chip>
        </div>
        <div>
          <div
            style={{
              font: "700 40px var(--font-display)",
              color: "var(--vxn-ink)",
              letterSpacing: "-.02em",
              lineHeight: 1,
            }}
          >
            {t.from} → {t.to}
          </div>
          <div
            style={{
              font: "500 15px var(--font-display)",
              color: "var(--vxn-fg-2)",
              marginTop: 6,
            }}
          >
            {t.date}
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div
            style={{
              padding: "10px 16px",
              background: "#fff",
              borderRadius: 10,
              border: "1px solid rgba(232,155,38,.3)",
            }}
          >
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              KHỞI HÀNH
            </div>
            <div
              style={{
                font: "700 22px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              {t.fromAt}
            </div>
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {t.fromStation}
            </div>
          </div>
          <Icon name="arrowRight" size={20} color="var(--vxn-saffron-700)" />
          <div
            style={{
              padding: "10px 16px",
              background: "#fff",
              borderRadius: 10,
              border: "1px solid rgba(232,155,38,.3)",
            }}
          >
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              ĐẾN NƠI
            </div>
            <div
              style={{
                font: "700 22px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              {t.toAt}
            </div>
            <div
              style={{
                font: "400 11px var(--font-display)",
                color: "var(--vxn-fg-5)",
              }}
            >
              {t.toStation}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            font: "400 13px var(--font-display)",
            color: "var(--vxn-fg-2)",
          }}
        >
          <div>
            <span style={{ color: "var(--vxn-fg-5)" }}>Ghế </span>
            <strong style={{ color: "var(--vxn-saffron-700)" }}>
              {t.seats.join(", ")}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--vxn-fg-5)" }}>Mã </span>
            <strong
              style={{
                color: "var(--vxn-ink)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t.code}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--vxn-fg-5)" }}>BS </span>
            <strong style={{ color: "var(--vxn-ink)" }}>{t.plate}</strong>
          </div>
        </div>
      </div>
      <div
        style={{
          background: "rgba(255,255,255,.7)",
          backdropFilter: "blur(6px)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          justifyContent: "center",
          borderLeft: "2px dashed #E89B26",
          position: "relative",
        }}
      >
        <PerforationDots side="left" colorSaffron />
        <QRBox label={t.code} bg="#fff" />
        <span
          style={{
            font: "500 12px var(--font-display)",
            color: "var(--vxn-saffron-700)",
            textAlign: "center",
          }}
        >
          Lên xe quét mã
        </span>
      </div>
    </div>
  );
}

// ── Ticket card variant: MINIMAL
function TicketCardMinimal({ t }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 4,
        border: "1px solid var(--vxn-ink)",
        display: "grid",
        gridTemplateColumns: "1fr 240px",
      }}
    >
      <div
        style={{
          padding: "40px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              font: "700 14px var(--font-display)",
              color: "var(--vxn-ink)",
              letterSpacing: ".4em",
            }}
          >
            VXN · {t.operator.name.toUpperCase()}
          </span>
          <span
            style={{
              font: "500 12px var(--font-mono)",
              color: "var(--vxn-fg-3)",
              letterSpacing: ".08em",
            }}
          >
            {t.code}
          </span>
        </div>
        <div>
          <div
            style={{
              font: "500 11px var(--font-display)",
              color: "var(--vxn-fg-5)",
              letterSpacing: ".18em",
            }}
          >
            F R O M · → · T O
          </div>
          <div
            style={{
              font: "300 56px var(--font-display)",
              color: "var(--vxn-ink)",
              letterSpacing: "-.025em",
              lineHeight: 1,
              marginTop: 12,
            }}
          >
            {t.from} <span style={{ color: "var(--vxn-saffron-600)" }}>→</span>{" "}
            {t.to}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            paddingTop: 24,
            borderTop: "1px solid var(--vxn-ink)",
          }}
        >
          {[
            ["DEPART", t.fromAt],
            ["ARRIVE", t.toAt],
            ["DATE", "15.05.26"],
            ["SEAT", t.seats.join(" · ")],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <span
                style={{
                  font: "500 10px var(--font-display)",
                  color: "var(--vxn-fg-5)",
                  letterSpacing: ".12em",
                }}
              >
                {l}
              </span>
              <span
                style={{
                  font: "500 22px var(--font-display)",
                  color: "var(--vxn-ink)",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            font: "400 13px var(--font-display)",
            color: "var(--vxn-fg-3)",
          }}
        >
          <span>
            <strong style={{ color: "var(--vxn-ink)" }}>{USER.fullName}</strong>{" "}
            · {t.passengers} người · {t.busType}
          </span>
          <span style={{ color: "var(--vxn-fg-5)" }}>BS {t.plate}</span>
        </div>
      </div>
      <div
        style={{
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          justifyContent: "center",
          borderLeft: "1px dashed var(--vxn-ink)",
        }}
      >
        <QRBox label={t.code} />
        <span
          style={{
            font: "500 10px var(--font-display)",
            color: "var(--vxn-fg-5)",
            letterSpacing: ".14em",
            textAlign: "center",
          }}
        >
          SCAN AT BOARDING
        </span>
      </div>
    </div>
  );
}

function DataPair({ label, value, accent }) {
  return (
    <div>
      <div
        style={{
          font: "500 11px var(--font-display)",
          color: "var(--vxn-fg-5)",
          letterSpacing: ".05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          font: "600 15px var(--font-display)",
          color: accent ? "var(--vxn-saffron-700)" : "var(--vxn-ink)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
function BPDataPair({ label, value, highlight }) {
  return (
    <div>
      <div
        style={{
          font: "500 11px var(--font-display)",
          color: "rgba(255,255,255,.55)",
          letterSpacing: ".08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          font: "700 16px var(--font-display)",
          color: highlight ? "var(--vxn-saffron-500)" : "#fff",
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function QRBox({ label, bg = "#fff" }) {
  // Crude QR-like pattern
  const rng = (seed) => {
    let s = seed;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  };
  const r = rng(label.charCodeAt(0) * label.length);
  return (
    <div
      style={{
        width: 168,
        height: 168,
        padding: 10,
        background: bg,
        border: "1px solid var(--vxn-border)",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(17, 1fr)",
          gap: 1.2,
          width: "100%",
          height: "100%",
        }}
      >
        {Array.from({ length: 17 * 17 }).map((_, i) => {
          const x = i % 17,
            y = Math.floor(i / 17);
          // Three finder squares
          const corner =
            (x < 5 && y < 5) || (x > 11 && y < 5) || (x < 5 && y > 11);
          if (corner) {
            const inner =
              x === 0 ||
              x === 4 ||
              y === 0 ||
              y === 4 ||
              x === 11 ||
              x === 15 ||
              y === 11 ||
              (y === 15 && false);
            const ring =
              (x < 5 && y < 5 && (x === 0 || x === 4 || y === 0 || y === 4)) ||
              (x > 11 &&
                y < 5 &&
                (x === 12 || x === 16 || y === 0 || y === 4)) ||
              (x < 5 && y > 11 && (x === 0 || x === 4 || y === 12 || y === 16));
            const block =
              (x < 5 && y < 5 && x >= 1 && x <= 3 && y >= 1 && y <= 3) ||
              (x > 11 && y < 5 && x >= 13 && x <= 15 && y >= 1 && y <= 3) ||
              (x < 5 && y > 11 && x >= 1 && x <= 3 && y >= 13 && y <= 15);
            const innerDot =
              (x < 5 && y < 5 && x === 2 && y === 2) ||
              (x > 11 && y < 5 && x === 14 && y === 2) ||
              (x < 5 && y > 11 && x === 2 && y === 14);
            const isBlock = ring || innerDot;
            const isWhite = block && !innerDot;
            return (
              <span
                key={i}
                style={{
                  background: isBlock ? "#000" : isWhite ? bg : "transparent",
                }}
              />
            );
          }
          const on = r() > 0.5;
          return (
            <span key={i} style={{ background: on ? "#000" : "transparent" }} />
          );
        })}
      </div>
    </div>
  );
}

function PerforationDots({ side, colorDark, colorSaffron }) {
  const color = colorDark
    ? "var(--vxn-teal-800)"
    : colorSaffron
      ? "#E89B26"
      : "#fff";
  return (
    <>
      <span
        style={{
          position: "absolute",
          top: -10,
          [side]: -10,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: colorDark ? "var(--vxn-bg-soft)" : color,
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: -10,
          [side]: -10,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: colorDark ? "var(--vxn-bg-soft)" : color,
        }}
      />
    </>
  );
}

// ============================================================
//  GUEST LOOKUP — /lookup (OTP 2-step)
// ============================================================
function GuestLookupScreen() {
  return (
    <Frame active="buy" signedIn={false}>
      <PageTopUtility crumbs={["Trang chủ", "Tra cứu vé"]} />
      <div
        style={{
          flex: 1,
          padding: "48px 32px",
          display: "grid",
          gridTemplateColumns: "480px 1fr",
          gap: 48,
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <Chip tone="teal" style={{ marginBottom: 12 }}>
              BƯỚC 2 / 2
            </Chip>
            <h1
              style={{
                margin: 0,
                font: "600 36px var(--font-display)",
                color: "var(--vxn-ink)",
                letterSpacing: "-.02em",
                lineHeight: 1.1,
              }}
            >
              Nhập mã OTP để xem vé
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                font: "400 16px var(--font-display)",
                color: "var(--vxn-fg-3)",
                lineHeight: 1.5,
              }}
            >
              Đã gửi mã 6 số tới{" "}
              <strong style={{ color: "var(--vxn-ink)" }}>0901 234 567</strong>.
              Mã có hiệu lực 5 phút.
            </p>
          </div>
          <Card padding={28}>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {["7", "2", "9", "4", "_", "_"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: 56,
                    height: 64,
                    borderRadius: 10,
                    border: `1.5px solid ${i < 4 ? vxnAccent() : "var(--vxn-border)"}`,
                    background: i < 4 ? "var(--vxn-info-bg)" : "#fff",
                    display: "grid",
                    placeItems: "center",
                    font: "700 30px var(--font-display)",
                    color: i < 4 ? "var(--vxn-ink)" : "var(--vxn-fg-disabled)",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                font: "400 13px var(--font-display)",
                color: "var(--vxn-fg-3)",
                marginBottom: 16,
              }}
            >
              <span>Còn lại 04:38</span>
              <span style={{ color: "var(--vxn-border-strong)" }}>·</span>
              <a
                style={{
                  color: "var(--vxn-teal-800)",
                  font: "500 13px var(--font-display)",
                }}
              >
                Gửi lại mã
              </a>
            </div>
            <Btn kind="primary" size="lg" style={{ width: "100%" }}>
              Xác nhận & xem vé
            </Btn>
            <Btn
              kind="link"
              style={{
                marginTop: 14,
                marginLeft: "auto",
                marginRight: "auto",
                display: "block",
              }}
            >
              ← Đổi số điện thoại
            </Btn>
          </Card>
        </div>
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
            alignSelf: "stretch",
            backgroundImage: `linear-gradient(180deg, rgba(0,40,60,.3), rgba(0,40,60,.7)), url(${window.__resources?.heroLandscape || "design-system/assets/hero-landscape.jpg"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            color: "#fff",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <Chip
            tone="saffron"
            style={{ alignSelf: "flex-start", marginBottom: 16 }}
          >
            KHÔNG CẦN ĐĂNG NHẬP
          </Chip>
          <h2
            style={{
              margin: 0,
              font: "600 28px var(--font-display)",
              maxWidth: 360,
              lineHeight: 1.2,
            }}
          >
            Tra cứu vé khách bằng số điện thoại hoặc email
          </h2>
          <p
            style={{
              margin: "12px 0 0",
              font: "400 15px var(--font-display)",
              color: "rgba(255,255,255,.85)",
              maxWidth: 380,
              lineHeight: 1.5,
            }}
          >
            Mọi vé đặt qua VXN — kể cả không có tài khoản — đều có thể tra cứu
            qua OTP. Vé hợp lệ hiển thị QR ngay sau khi xác thực.
          </p>
        </div>
      </div>
    </Frame>
  );
}

// ============================================================
//  GUEST CANCEL — /guest/cancel
// ============================================================
function GuestCancelScreen() {
  return (
    <Frame active="buy" signedIn={false}>
      <PageTopUtility crumbs={["Trang chủ", "Hủy vé khách"]} />
      <PageHeader
        title="Hủy vé không đăng nhập"
        subtitle="Khách hàng không có tài khoản có thể hủy vé tại đây. Tiền hoàn theo chính sách của nhà xe."
        back={false}
      />
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 24,
        }}
      >
        <Card padding={32}>
          <h3
            style={{
              margin: "0 0 18px",
              font: "600 18px var(--font-display)",
              color: "var(--vxn-ink)",
            }}
          >
            Xác thực vé
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <FieldFilled
              label="Mã đặt vé *"
              value="VXN-AB7K-2401"
              icon="ticket"
            />
            <FieldFilled
              label="Số điện thoại đặt vé *"
              value="0901 234 567"
              icon="phone"
            />
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "var(--vxn-bg-soft)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Chip tone="success" icon="checkCircle">
                VÉ ĐƯỢC TÌM THẤY
              </Chip>
              <span
                style={{
                  font: "500 13px var(--font-mono)",
                  color: "var(--vxn-fg-3)",
                }}
              >
                VXN-AB7K-2401
              </span>
            </div>
            <div
              style={{
                font: "600 18px var(--font-display)",
                color: "var(--vxn-ink)",
              }}
            >
              Hà Nội → Sapa
            </div>
            <div
              style={{
                font: "400 13px var(--font-display)",
                color: "var(--vxn-fg-3)",
              }}
            >
              T6, 15/05/2026 · 08:15 → 13:30 · Ghế B02, C02 · Tâm Hạnh Limousine
            </div>
          </div>

          <h3
            style={{
              margin: "0 0 14px",
              font: "600 16px var(--font-display)",
              color: "var(--vxn-ink)",
            }}
          >
            Lý do hủy vé
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {[
              "Tôi đổi kế hoạch",
              "Tìm được chuyến tốt hơn",
              "Lý do sức khoẻ",
              "Lý do gia đình",
              "Đặt nhầm vé",
              "Khác",
            ].map((l, i) => (
              <label
                key={l}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${i === 0 ? vxnAccent() : "var(--vxn-border)"}`,
                  background: i === 0 ? "var(--vxn-info-bg)" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  font: "400 13px var(--font-display)",
                  color: "var(--vxn-fg-2)",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `2px solid ${i === 0 ? vxnAccent() : "var(--vxn-border-strong)"}`,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {i === 0 && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: vxnAccent(),
                      }}
                    />
                  )}
                </span>
                {l}
              </label>
            ))}
          </div>

          <Btn kind="danger" size="lg" style={{ width: "100%" }}>
            Xác nhận hủy vé
          </Btn>
        </Card>

        <Card padding={24}>
          <h3
            style={{
              margin: "0 0 14px",
              font: "600 16px var(--font-display)",
              color: "var(--vxn-ink)",
            }}
          >
            Số tiền hoàn dự kiến
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              font: "400 13px var(--font-display)",
              color: "var(--vxn-fg-3)",
            }}
          >
            <Row label="Đã thanh toán" value={VND(899100)} />
            <Row
              label="Phí hủy (10%)"
              value={`-${VND(89910)}`}
              valueColor="var(--vxn-danger-fg)"
            />
            <Row label="Chính sách" value="Hủy trước 24h" />
          </div>
          <div
            style={{
              margin: "16px 0",
              padding: 16,
              background: "var(--vxn-success-bg)",
              borderRadius: 10,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                font: "500 13px var(--font-display)",
                color: "var(--vxn-success-fg)",
              }}
            >
              Hoàn lại
            </span>
            <span
              style={{
                font: "700 22px var(--font-display)",
                color: "var(--vxn-success-fg)",
              }}
            >
              {VND(809190)}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              font: "400 12px var(--font-display)",
              color: "var(--vxn-fg-5)",
              lineHeight: 1.5,
            }}
          >
            Tiền sẽ được hoàn về cùng phương thức thanh toán ban đầu trong vòng
            3 — 5 ngày làm việc.
          </p>
        </Card>
      </div>
    </Frame>
  );
}

function FieldFilled({ label, value, placeholder, icon, empty }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          font: "500 12px var(--font-display)",
          color: "var(--vxn-fg-3)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 48,
          padding: "0 14px",
          border: "1px solid var(--vxn-border)",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <Icon name={icon} size={16} color="var(--vxn-fg-5)" />
        <span
          style={{
            font: `500 15px var(--font-display)`,
            color: empty ? "var(--vxn-fg-disabled)" : "var(--vxn-ink)",
          }}
        >
          {value || placeholder}
        </span>
      </div>
    </label>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span style={{ color: valueColor || "var(--vxn-ink)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

Object.assign(window, {
  MyTicketsScreen,
  TicketDetailScreen,
  GuestLookupScreen,
  GuestCancelScreen,
});
