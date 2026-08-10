import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position } from '@xyflow/react';
import { cardinalityById } from '../config/elementTypes';

const STROKE = '#475569';

// 端点朝向节点内部的单位方向
function dirFor(position) {
  switch (position) {
    case Position.Left: return [1, 0];
    case Position.Right: return [-1, 0];
    case Position.Top: return [0, 1];
    case Position.Bottom: return [0, -1];
    default: return [0, -1];
  }
}

// 在端点 (x,y) 处按方向绘制乌鸦脚符号
function foot(x, y, position, endType, keyPrefix) {
  if (!endType) return null;
  const [dx, dy] = dirFor(position);
  const [px, py] = [-dy, dx]; // 垂直方向
  const along = (t) => [x + dx * t, y + dy * t];
  const perpAt = (base, t) => [base[0] + px * t, base[1] + py * t];
  const Wp = 7;
  const L = 15;
  const els = [];
  const ln = (a, b, k) => els.push(<line key={`${keyPrefix}-${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={STROKE} strokeWidth={1.5} />);
  const circ = (c, r, k) => els.push(<circle key={`${keyPrefix}-${k}`} cx={c[0]} cy={c[1]} r={r} fill="white" stroke={STROKE} strokeWidth={1.5} />);

  const many = (offset) => {
    const C = along(-(L + offset));               // 汇聚点（线一侧）
    const midTip = along(-offset);                 // 中间尖端（节点一侧）
    ln(C, midTip, 'm0');
    ln(C, perpAt(midTip, Wp), 'm1');
    ln(C, perpAt(midTip, -Wp), 'm2');
  };
  const one = (offset) => {
    const c = along(-offset);
    ln(perpAt(c, Wp), perpAt(c, -Wp), 'one');
  };

  switch (endType) {
    case 'one': one(8); break;
    case 'many': many(0); break;
    case 'zeroOne': one(9); circ(along(-20), 4, 'c'); break;
    case 'oneMany': many(0); one(L + 6); break;
    case 'zeroMany': many(0); circ(along(-(L + 9)), 3.5, 'c'); break;
    default: break;
  }
  return els;
}

export default function ERCrowEdge(props) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, label, data } = props;
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const card = cardinalityById(data?.cardinality);

  return (
    <>
      <BaseEdge id={id} path={path} style={style} />
      {card && (
        <g>
          {foot(sourceX, sourceY, sourcePosition, card.start, 's')}
          {foot(targetX, targetY, targetPosition, card.end, 't')}
        </g>
      )}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              background: '#f8fafc', color: '#334155', fontSize: 12, padding: '0 4px', borderRadius: 2,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
