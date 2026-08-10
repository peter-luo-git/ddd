// Crow's Foot（乌鸦脚）SVG 边标记定义。
// 每个 marker 以 orient="auto-start-reverse"，可同时用于关系两端（起点会自动镜像）。
// 坐标：x 增大方向朝向实体节点（node 在右侧 x=W）。
const W = 22;
const stroke = '#475569';
const common = {
  markerWidth: W, markerHeight: 20, refX: W, refY: 10,
  orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse',
};
const line = { stroke, strokeWidth: 1.5, fill: 'none' };

const ERMarkers = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
    <defs>
      {/* 一（single bar） */}
      <marker id="cf-one" {...common}>
        <path d="M14,3 L14,17" {...line} />
      </marker>
      {/* 多（crow's foot） */}
      <marker id="cf-many" {...common}>
        <path d="M0,10 L22,1 M0,10 L22,10 M0,10 L22,19" {...line} />
      </marker>
      {/* 零或一（circle + bar） */}
      <marker id="cf-zeroOne" {...common}>
        <circle cx="5" cy="10" r="4" fill="white" stroke={stroke} strokeWidth="1.5" />
        <path d="M16,3 L16,17" {...line} />
      </marker>
      {/* 一或多（bar + crow） */}
      <marker id="cf-oneMany" {...common}>
        <path d="M2,3 L2,17" {...line} />
        <path d="M4,10 L22,1 M4,10 L22,10 M4,10 L22,19" {...line} />
      </marker>
      {/* 零或多（circle + crow） */}
      <marker id="cf-zeroMany" {...common}>
        <circle cx="3" cy="10" r="3" fill="white" stroke={stroke} strokeWidth="1.5" />
        <path d="M8,10 L22,1 M8,10 L22,10 M8,10 L22,19" {...line} />
      </marker>
    </defs>
  </svg>
);

// 端类型 → marker id
// eslint-disable-next-line react-refresh/only-export-components
export const cfMarker = (endType) => (endType ? `url(#cf-${endType})` : undefined);

export default ERMarkers;
