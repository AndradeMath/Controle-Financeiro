import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

function GraficoEvolucao({ dados }) {
  const descricao = dados
    .map(
      ({ rotulo, receitas, despesas }) =>
        `${rotulo}: receitas ${formatarValor(receitas)}, despesas ${formatarValor(despesas)}`,
    )
    .join("; ");

  return (
    <div
      className="dashboard__grafico dashboard__grafico--evolucao"
      role="img"
      aria-label={`Evolução mensal de receitas e despesas: ${descricao}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          margin={{ top: 8, right: 12, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke="#eeedf0" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: "#716b7b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatarValor}
            tick={{ fill: "#716b7b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip formatter={(valor) => formatarValor(valor)} />
          <Legend />
          <Bar
            dataKey="receitas"
            name="Receitas"
            fill="#2d936c"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="despesas"
            name="Despesas"
            fill="#c43d36"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GraficoEvolucao;
