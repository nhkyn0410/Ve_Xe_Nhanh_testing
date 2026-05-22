import { Link } from 'react-router-dom';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

const baseLinkClass =
  'inline-flex min-w-0 max-w-[min(64vw,420px)] items-center font-medium text-vxn-teal-800 transition hover:text-vxn-teal-900';
const mutedClass =
  'inline-flex min-w-0 max-w-[min(64vw,420px)] truncate font-medium text-vxn-fg-3';
const currentClass =
  'inline-flex min-w-0 max-w-[min(64vw,420px)] truncate font-medium text-vxn-ink';

const CustomerBreadcrumbMenu = ({ item, isLast, labelNode }) => {
  const menuItems = item.menu || [];

  return (
    <div className="group relative -m-1 min-w-0 p-1">
      <div
        role={isLast ? 'button' : undefined}
        tabIndex={isLast ? 0 : undefined}
        aria-haspopup="menu"
        className="inline-flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 transition group-hover:bg-vxn-bg-mist group-focus-within:bg-vxn-bg-mist"
      >
        {labelNode}
        <DownOutlined
          aria-hidden="true"
          className={`text-[9px] ${
            isLast ? 'text-vxn-fg-3' : 'text-vxn-teal-700'
          }`}
        />
      </div>
      <div className="invisible absolute left-0 top-full z-50 w-[280px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-xl border border-vxn-border bg-white p-2 shadow-[0_18px_45px_-24px_rgba(15,23,42,.45)]">
          <div className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-vxn-fg-5">
            Khu vực tài khoản
          </div>
          <div className="flex flex-col gap-1">
            {menuItems.map((menuItem) => {
              const Icon = menuItem.icon;

              return (
                <Link
                  key={menuItem.key || menuItem.to || menuItem.label}
                  to={menuItem.to}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-vxn-bg-mist"
                >
                  {Icon && (
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-vxn-bg-soft text-vxn-teal-700">
                      <Icon style={{ fontSize: 14 }} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-vxn-ink">
                      {menuItem.label}
                    </span>
                    {menuItem.description && (
                      <span className="mt-0.5 block text-[11px] leading-4 text-vxn-fg-4">
                        {menuItem.description}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerBreadcrumb = ({ items = [], className = '' }) => {
  const trail = [{ label: 'Trang chủ', to: '/' }, ...items].filter(
    (item) => item?.label
  );

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="m-0 flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0 text-[13px] leading-5 text-vxn-fg-4">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          const to = item.to || item.path || item.href;
          const hasMenu = item.menu?.length > 0;
          const labelNode =
            to && !isLast ? (
              <Link to={to} className={baseLinkClass}>
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={isLast ? currentClass : mutedClass}
              >
                {item.label}
              </span>
            );

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 && (
                <RightOutlined
                  aria-hidden="true"
                  className="text-[10px] text-vxn-fg-5"
                />
              )}
              {hasMenu ? (
                <CustomerBreadcrumbMenu
                  item={item}
                  isLast={isLast}
                  labelNode={labelNode}
                />
              ) : (
                labelNode
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CustomerBreadcrumb;
