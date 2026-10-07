import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function GraficoDespesas({ dados }) {
  const descricao = dados
    .map(({ categoria, valor }) => `${categoria}, ${formatarValor(valor)}`)
    .join("; ");

  return (
    <div
      className="dashboard__grafico"
      role="img"
      aria-label={`Gráfico de despesas por categoria: ${descricao}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            stroke="#eeedf0"
            horizontal={false}
            vertical
          />
          <XAxis
            type="number"
            tickFormatter={formatarValor}
            tick={{ fill: "#716b7b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="categoria"
            width={105}
            tick={{ fill: "#413b4b", fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(valor) => [formatarValor(valor), "Despesas"]}
            cursor={{ fill: "rgb(103 80 164 / 8%)" }}
          />
          <Bar
            dataKey="valor"
            name="Despesas"
            fill="#6750a4"
            radius={[0, 5, 5, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GraficoDespesas;
