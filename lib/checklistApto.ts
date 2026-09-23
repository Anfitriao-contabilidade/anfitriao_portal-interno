// Checklist de prontidão do imóvel — mesma base de dados e mesma fórmula de
// nota usadas no Painel Interno (aba Clientes), a partir do checklist
// "Itens essenciais" (Romulo Villela) enviado pelo usuário: 7 categorias,
// 83 itens no total.
//
// Decisões de escopo confirmadas com o usuário (mesmas dos dois sistemas):
//   - Tanto o proprietário/co-anfitrião (aqui, no Portal do Cliente) quanto a
//     equipe (Painel Interno) podem marcar os itens — mas cada sistema guarda
//     sua própria marcação (bancos diferentes, sem sincronização — mesma
//     limitação já registrada para Estoque).
//   - Os itens que o documento original descreve como opcionais (Forno,
//     Cabeceira, Rack para TV, Liquidificador, Lava e seca, Aspirador de pó,
//     Taça de vinho) contam igual a todos os outros na nota — sem tratamento
//     especial (a observação de que são opcionais continua só no texto da
//     própria descrição, como no doc original).
//   - Nota 0 a 10 com peso igual por categoria: cada uma das 7 categorias
//     vale 1/7 da nota final, não importa quantos itens tem (Cozinha tem 32
//     itens, Banheiro só 6).
//
// Cada item tem, além de "desc" (a razão/quantidade sugerida do doc
// original, mostrada ao lado da checkbox), um "impacto": por que vale a pena
// o proprietário investir nesse item e o que falta na experiência do
// hóspede quando ele não está presente. É o "impacto" que aparece na lista
// de sugestões (pedido do usuário).

export type ChecklistItem = { nome: string; qtd: string; desc: string; impacto: string };
export type ChecklistCategoria = { nome: string; itens: ChecklistItem[] };

export const CHECKLIST_APTO_CATEGORIAS: ChecklistCategoria[] = [
  {
    nome: "Quarto",
    itens: [
      { nome: "Cama de casal", qtd: "1", desc: "Tamanho Padrão, Queen ou King Size", impacto: "Uma cama confortável e do tamanho certo é a base de uma boa noite de sono; sem isso, o hóspede acorda mal e a experiência de estadia já começa ruim." },
      { nome: "Criado mudo", qtd: "2", desc: "Para apoio de celular, luminárias etc", impacto: "Sem um lugar para apoiar celular, óculos e pertences, o hóspede improvisa no chão ou na cama — passa a sensação de imóvel mal pensado para o dia a dia." },
      { nome: "Luminárias", qtd: "2", desc: "De teto, de chão ou pequenas", impacto: "Sem iluminação adequada além da luz de teto (geralmente forte demais à noite), ler ou se aprontar no quarto vira desconfortável." },
      { nome: "Cabeceira", qtd: "1", desc: "Não é obrigatório, mas protege a parede", impacto: "É opcional, mas protege a parede de manchas e dá um acabamento mais hotelaria; sem ela, a parede atrás da cama se deteriora mais rápido." },
      { nome: "Travesseiros", qtd: "4", desc: "De 2 a 4 travesseiros por cama", impacto: "Poucos travesseiros (ou de má qualidade) são uma das reclamações mais comuns em avaliações de hospedagem — item básico que pesa direto na nota." },
      { nome: "Guarda roupas", qtd: "1", desc: "Espaço para armazenar e apoiar roupas com cabide e prateleiras", impacto: "Em estadias de mais de 1-2 noites o hóspede precisa desfazer a mala; sem espaço para guardar roupas, o quarto vira bagunçado e ele não sente o espaço como seu." },
      { nome: "Colchão", qtd: "1", desc: "Nem muito mole, nem muito duro e de acordo com o tamanho da cama", impacto: "Colchão ruim é motivo direto de avaliação baixa e comentário público — é o item que mais afeta a qualidade do sono, o principal motivo de uma hospedagem." },
      { nome: "Decoração", qtd: "1", desc: "Itens de decoração para deixar o ambiente mais amigável e confortável", impacto: "Um quarto sem nenhum toque decorativo parece depósito; pequenos itens fazem o hóspede sentir que o espaço foi pensado para acolher, não só alugado." },
      { nome: "Smart TV", qtd: "1", desc: "Pode ter apenas na sala, mas também é bacana se tiver no quarto (com Netflix)", impacto: "Ter streaming no quarto é um diferencial de conforto em dias de descanso; sem isso, o hóspede fica limitado ao celular para entretenimento." },
      { nome: "Ar condicionado", qtd: "1", desc: "Para regiões mais quentes, essencial ter, ou apenas ventilador de teto ou de chão", impacto: "Em regiões quentes, dormir sem climatização (nem ventilador) é uma das reclamações mais graves de hospedagem — pode até gerar pedido de reembolso." },
      { nome: "Lixo", qtd: "1", desc: "Uma lata de lixo para dar maior comodidade aos residentes. Pode ser pequena.", impacto: "Sem lixeira no quarto, o hóspede acumula lixo por perto ou precisa ir até a cozinha toda hora — detalhe pequeno que pesa na praticidade do dia a dia." },
    ],
  },
  {
    nome: "Sala",
    itens: [
      { nome: "Sofá-cama", qtd: "1", desc: "Buscar por conforto e qualidade para servir de cama extra, além de ambiente para TV.", impacto: "Além de mobiliar a sala, funciona como cama extra para grupos maiores; sem ele, o imóvel aceita menos hóspedes e fica menos competitivo." },
      { nome: "Travesseiros", qtd: "2", desc: "De 1 a 2 travesseiros", impacto: "Sem travesseiro no sofá-cama, quem dorme ali tem uma noite pior que quem está no quarto — cria desigualdade de conforto dentro do próprio grupo." },
      { nome: "Smart TV", qtd: "1", desc: "De preferência Smart para Youtube e Netflix, geralmente buscado em centros urbanos", impacto: "A sala costuma ser o ponto de encontro do grupo à noite; sem Smart TV com streaming, a diversão em grupo fica mais pobre, principalmente em estadias longas." },
      { nome: "Ar condicionado", qtd: "1", desc: "Para regiões mais quentes, essencial ter, ou apenas ventilador de teto ou de chão", impacto: "Sala quente demais durante o dia afasta o hóspede do ambiente comum e o empurra para o quarto o dia todo, reduzindo o conforto geral da estadia." },
      { nome: "Rack para TV", qtd: "1", desc: "Não é regra, pode não ter, mas lembre-se do design da sala para não ficar muito vazia", impacto: "Não é obrigatório, mas sem ele a TV fica apoiada de forma improvisada — passa uma imagem de imóvel montado às pressas." },
      { nome: "Tapete", qtd: "1", desc: "Uma boa opção para preencher o espaço da sala com um item bonito", impacto: "Ambiente sem tapete tende a parecer mais frio e vazio nas fotos e na visita presencial, o que pesa na primeira impressão do hóspede ao chegar." },
      { nome: "Almofadas decorativas", qtd: "3", desc: "Almofadas diversas para dar um charme para o sofá e o ambiente", impacto: "Sofá sem almofada parece inacabado nas fotos do anúncio — item barato com efeito visual desproporcional na primeira impressão." },
      { nome: "Quadros", qtd: "—", desc: "Não há quantidade certa, mas lembre-se de não deixar as paredes sem vida.", impacto: "Paredes vazias reforçam a sensação de \"imóvel alugado\", não de um lugar preparado para receber bem; quadros simples já mudam essa percepção." },
      { nome: "Mesa e cadeiras", qtd: "1", desc: "Mesa para refeições com 4 cadeiras (poderá servir também para área de trabalho)", impacto: "Sem mesa para refeições, o grupo come no sofá ou na cama — desconfortável para famílias e ruim para quem também usa o espaço como home office." },
      { nome: "Itens de decoração", qtd: "—", desc: "A decoração do ambiente é importante para deixar o imóvel agradável e receptivo", impacto: "A ausência total de decoração é um dos motivos mais citados em avaliações como \"imóvel frio\" ou \"sem charme\", mesmo quando a estrutura é boa." },
      { nome: "Fechadura eletrônica", qtd: "1", desc: "Para economia de tempo, segurança e facilidade para o hóspede e proprietário", impacto: "Sem ela, o check-in depende de entrega física de chave (ou porteiro), o que atrasa a chegada do hóspede e gera custo/logística extra para o proprietário." },
    ],
  },
  {
    nome: "Cozinha",
    itens: [
      { nome: "Fogão", qtd: "1", desc: "Cooktop, embutido, de 2 ou 4 bocas, vai do tamanho do espaço para ele", impacto: "Sem fogão, o hóspede não consegue preparar nem o básico (café, ovo, macarrão) — praticamente obriga a comer fora em toda refeição, encarecendo a estadia dele." },
      { nome: "Forno", qtd: "—", desc: "Opcional (depende das características do imóvel e da localização)", impacto: "Opcional — depende do perfil do imóvel e da região —, mas sua ausência limita o hóspede a pratos simples, sem poder assar ou fazer receitas mais elaboradas." },
      { nome: "Geladeira/Frigobar", qtd: "1", desc: "Se tiver espaço, invista em uma geladeira, se não, um frigobar pode ser suficiente", impacto: "Sem refrigeração, o hóspede não pode guardar comida ou bebida gelada — um problema sério em qualquer estadia acima de 1 dia." },
      { nome: "Microondas", qtd: "1", desc: "Pode ser pequeno, invista na qualidade da marca e no design", impacto: "Esquentar comida ou pipoca sem microondas é bem mais trabalhoso; a ausência dele é sentida logo na primeira refeição." },
      { nome: "Cafeteira", qtd: "1", desc: "Opção prática e barata para os residentes, evitando compra de filtros.", impacto: "Café é ritual de manhã para boa parte dos hóspedes; sem cafeteira, ele precisa sair de casa cedo só para tomar um café." },
      { nome: "Jogo de panelas", qtd: "1", desc: "Aquele jogo com as peças essenciais: Frigideira, panela pequena, média e grande.", impacto: "Sem o básico (frigideira + panelas de tamanhos diferentes), o hóspede não consegue cozinhar quase nada — praticamente inviabiliza o uso da cozinha." },
      { nome: "Utensílios de cozinha", qtd: "1", desc: "Kit com escumadeira, colher grande, colher de silicone", impacto: "Sem escumadeira/colheres, até tarefas simples como fritar um ovo ou misturar um molho ficam mais difíceis — detalhe pequeno que pesa na praticidade." },
      { nome: "Abridor de latas", qtd: "1", desc: "Essencial e barato!", impacto: "Item baratíssimo cuja falta é desproporcionalmente frustrante — o hóspede literalmente não consegue abrir uma lata de conserva." },
      { nome: "Abridor de vinho", qtd: "1", desc: "Essencial e barato!", impacto: "Hóspede que trouxe uma garrafa de vinho e não consegue abri-la vive um dos momentos mais frustrantes (e evitáveis) de uma estadia." },
      { nome: "Peneira", qtd: "1", desc: "Essencial e barato!", impacto: "Detalhe pequeno, mas sua falta atrapalha tarefas básicas como coar macarrão ou lavar grãos — força o hóspede a improvisar." },
      { nome: "Faca de corte", qtd: "1", desc: "Faca boa e grande para carnes, verduras e legumes", impacto: "Sem uma faca boa, cortar carne ou legumes vira perigoso e frustrante — um dos utensílios mais usados em qualquer cozinha." },
      { nome: "Conjunto de talheres", qtd: "1", desc: "Kit com colher de chá, sopa, garfo e faca de serra.", impacto: "Sem talheres suficientes para o grupo todo, alguém sempre fica esperando a vez — detalhe simples que gera fila e mau humor na hora da refeição." },
      { nome: "Conjunto de xícara", qtd: "1", desc: "Xícaras de chá e café (tamanho pequeno e grande) 1 jogo de 4 cada + pires", impacto: "Sem xícaras, servir um café ou chá para visitas ou para o próprio grupo fica sem graça — pesa na experiência de hospitalidade dentro do imóvel." },
      { nome: "Canecas", qtd: "4", desc: "Canecas para outros tipos de bebidas", impacto: "Sem canecas, bebidas quentes em maior quantidade (chá, chocolate) ficam mais difíceis de servir para o grupo todo ao mesmo tempo." },
      { nome: "Conjunto de copos", qtd: "1", desc: "Pode ser básico ou mais bonito, cj. De 6 unidades é suficiente", impacto: "Sem copos suficientes, o grupo tem que dividir ou lavar toda hora — incômodo bobo, mas frequente, principalmente em grupos maiores." },
      { nome: "Conjunto de pratos", qtd: "2", desc: "Pratos para refeição (4 unid.) / Pratos para sobremesa (4 unid.)", impacto: "Sem pratos para todos, refeições em grupo ficam impossíveis de servir ao mesmo tempo — problema básico já na primeira refeição." },
      { nome: "Conjunto de bowls", qtd: "1", desc: "Para armazenar alimentos ou preparo de cozinha", impacto: "Sem bowls, guardar sobras ou preparar uma salada/cereal fica mais difícil — reduz a praticidade da cozinha no dia a dia." },
      { nome: "Dispenser detergente", qtd: "1", desc: "Dispenser para detergente", impacto: "Detalhe pequeno, mas sem ele o detergente costuma vazar ou sujar a pia — passa uma imagem de descuido com a limpeza." },
      { nome: "Esponja de louça", qtd: "1", desc: "Esponja para louça", impacto: "Sem esponja, o hóspede não consegue lavar louça — item básico cuja ausência é notada já na primeira refeição." },
      { nome: "Rodinho de pia", qtd: "1", desc: "Para manutenção da área molhada", impacto: "Sem rodinho, a pia acumula água parada e mancha mais rápido — detalhe de manutenção que também afeta a impressão de limpeza." },
      { nome: "Pano de prato", qtd: "5", desc: "A gosto!", impacto: "Sem pano de prato, secar louça ou limpar um respingo vira improviso com papel toalha ou pano de banho — incômodo evitável." },
      { nome: "Potes", qtd: "3", desc: "Legal deixar óleo, sal e açúcar a disposição dos residentes", impacto: "Sem potes para sal/açúcar/óleo à disposição, o hóspede não sabe onde guardar o que sobrou de uma receita — a cozinha parece incompleta." },
      { nome: "Escorredor de macarrão", qtd: "1", desc: "De plástico, simples.", impacto: "Sem escorredor, escorrer massa ou legumes vira risco de queimadura e bagunça na pia — item simples, mas essencial." },
      { nome: "Taça de vinho", qtd: "4", desc: "Não é essencial, mas pode ser uma opção a mais para o residente", impacto: "Não é essencial, mas sem elas o hóspede que trouxe vinho acaba bebendo em copo comum — pequeno detalhe que muda a experiência de uma noite especial." },
      { nome: "Escorredor de pratos", qtd: "1", desc: "Essencial", impacto: "Sem escorredor, a louça lavada fica empilhada na pia ou na bancada, molhando tudo ao redor — pesa na sensação de organização da cozinha." },
      { nome: "Lixo com pedal", qtd: "1", desc: "Para melhor higiene escolher basculante ou com pedal", impacto: "Sem lixeira adequada (de preferência com tampa), o lixo da cozinha fica exposto — problema de higiene e de cheiro que o hóspede sente rapidamente." },
      { nome: "Jarra", qtd: "1", desc: "De plástico (para evitar cair e quebrar) para sucos, água etc", impacto: "Sem jarra, servir água ou suco gelado para o grupo todo de uma vez fica mais difícil — precisa encher copo por copo direto na garrafa." },
      { nome: "Filtro", qtd: "1", desc: "Recomendável filtro de água, seja externo ou acoplado à torneira da cozinha", impacto: "Sem filtro de água, o hóspede pode desconfiar da qualidade da água da torneira — impacta a sensação de cuidado com a saúde dele." },
      { nome: "Tábua de corte", qtd: "1", desc: "Tábua para corte de carnes, verduras e legumes", impacto: "Cortar direto na bancada danifica a superfície e é visto como falta de cuidado — a tábua também facilita e agiliza o preparo das refeições." },
      { nome: "Jogo americano", qtd: "3", desc: "Para apoio às refeições", impacto: "Sem jogo americano, a mesa de refeição fica com aparência mais pobre nas fotos e no dia a dia — detalhe barato com bom retorno visual." },
      { nome: "Descanso de panelas", qtd: "5", desc: "Sugestão para proteção de mesas e bancadas", impacto: "Sem descanso, panela quente pode manchar ou queimar a bancada/mesa — prejuízo de manutenção que se acumula com o tempo." },
      { nome: "Liquidificador", qtd: "1", desc: "Opcional, não essencial", impacto: "Opcional, mas sem ele o hóspede não consegue preparar vitaminas, sucos batidos ou receitas simples — reduz o uso da cozinha para quem gosta de cozinhar em casa." },
    ],
  },
  {
    nome: "Enxoval",
    itens: [
      { nome: "Cobertor/Edredon", qtd: "4", desc: "2 para cada cama (1 sempre para reserva) – para dias mais frios", impacto: "Sem cobertor reserva, uma noite mais fria pega o hóspede desprevenido — e ele não tem pra onde recorrer no meio da madrugada." },
      { nome: "Mantas", qtd: "3", desc: "Para dias mais quentes (serve também para acabamento da arrumação da cama)", impacto: "Em dias mais quentes o edredom pode ser pesado demais; sem manta como alternativa mais leve, o hóspede pode passar calor à noite." },
      { nome: "Roupas de cama", qtd: "5", desc: "3 jogos de cama casal + 2 para sofá cama (levar em conta as trocas de hóspedes)", impacto: "Sem jogos suficientes para trocar entre hóspedes, a limpeza atrasa o check-in seguinte ou obriga a lavar roupa às pressas — risco real de atraso operacional." },
      { nome: "Protetor de travesseiro", qtd: "6", desc: "Essencial para proteger o travesseiro e ser mais higiênico por conta das trocas", impacto: "Sem protetor, o travesseiro absorve suor e oleosidade direto — estraga mais rápido e passa sensação de menor higiene para o próximo hóspede." },
      { nome: "Protetor de colchão", qtd: "2", desc: "1 a 2 protetores, importante para preservar o colchão e proteger de líquidos", impacto: "Sem proteção, qualquer líquido derramado (ou acidente) pode estragar o colchão de vez — um item barato que evita um prejuízo caro." },
      { nome: "Toalha de banho", qtd: "9", desc: "Considerando o fluxo máximo de 3 pessoas em 3 trocas seguidas", impacto: "Faltar toalha de banho para todo o grupo é uma das reclamações mais diretas e imediatas que existem — o hóspede sente a falta já no primeiro banho." },
      { nome: "Toalha de rosto", qtd: "9", desc: "Uma por pessoa do grupo", impacto: "Sem toalha de rosto individual, o grupo compartilha ou improvisa com a toalha de banho — pequeno detalhe de higiene que pesa na percepção geral." },
      { nome: "Toalha de piso", qtd: "3", desc: "De 3 em diante (levando em conta o ciclo dos enxovais)", impacto: "Sem toalha de piso, o chão do banheiro fica molhado e escorregadio depois do banho — risco de acidente e sensação de descuido." },
    ],
  },
  {
    nome: "Banheiro",
    itens: [
      { nome: "Sabonete", qtd: "1", desc: "Sabonete líquido em dispenser (evita desperdício e reduz custo)", impacto: "Chegar e não ter nem sabonete disponível é visto como falta grave de preparo — item básico que deveria estar garantido em qualquer estadia." },
      { nome: "Shampoo", qtd: "1", desc: "Shampoo em dispenser (evita desperdício e reduz custo)", impacto: "Mesma lógica do sabonete: sua ausência obriga o hóspede a sair para comprar algo básico logo na chegada, o que já compromete a primeira impressão." },
      { nome: "Secador de cabelo", qtd: "1", desc: "Pode ser solto ou preso na parede", impacto: "Sem secador, hóspedes com cabelo mais longo (ou em dias frios) sentem bastante falta — item pequeno, mas de alto impacto percebido." },
      { nome: "Papel higiênico", qtd: "1", desc: "Sempre folha dupla (rende mais e tem melhor custo benefício, além do conforto)", impacto: "É o item mais básico de todos — sua falta gera reclamação imediata e prejudica a confiança do hóspede em todo o resto do imóvel." },
      { nome: "Lixo", qtd: "1", desc: "Nem preciso dizer!", impacto: "Sem lixeira no banheiro, o hóspede não tem onde descartar itens de higiene — problema de praticidade e de limpeza." },
      { nome: "Ducha Higiênica", qtd: "1", desc: "Muitos aptos ganham um diferencial com essa ducha", impacto: "Não é obrigatória em todo lugar, mas hóspedes acostumados a ela sentem falta rapidamente — pequeno diferencial já considerado padrão em muitas regiões." },
    ],
  },
  {
    nome: "Lavanderia",
    itens: [
      { nome: "Ferro de passar", qtd: "1", desc: "Interessante para centros urbanos", impacto: "Sem ferro, quem precisa passar uma roupa para um compromisso durante a viagem fica na mão — pesa mais em estadias de negócios." },
      { nome: "Tábua de passar", qtd: "1", desc: "Evite tábuas muito baratas pois elas são bambas e quebram fácil.", impacto: "Sem tábua, passar roupa fica mais difícil e arriscado (queimar a mesa, por exemplo) — o ferro sozinho não resolve." },
      { nome: "Lava e seca", qtd: "1", desc: "Caso haja espaço, seria um diferencial", impacto: "Não é obrigatório, mas sua ausência é sentida em estadias mais longas, quando o hóspede precisa lavar roupa e não tem onde." },
      { nome: "Panos de limpeza", qtd: "5", desc: "A gosto!", impacto: "Sem panos, qualquer limpeza rápida feita pelo próprio hóspede (um respingo, por exemplo) fica sem solução prática." },
      { nome: "Vassoura", qtd: "1", desc: "De preferência os macios, evitar de piaçava e semelhantes", impacto: "Sem vassoura, uma sujeira simples no chão não tem como ser resolvida pelo próprio hóspede entre as faxinas." },
      { nome: "Rodo", qtd: "1", desc: "Escolha de boa qualidade e durabilidade", impacto: "Sem rodo, água no chão (área de serviço, varanda) demora mais para secar e pode até gerar risco de escorregão." },
      { nome: "Pá de lixo", qtd: "1", desc: "Pá com cabo para facilitar a limpeza", impacto: "Sem pá, varrer e recolher sujeira do chão fica mais trabalhoso e menos eficaz." },
      { nome: "Aspirador de pó", qtd: "1", desc: "Opção para maior comodidade (aqueles compactos)", impacto: "Facilita muito a manutenção da limpeza entre uma faxina e outra, principalmente com tapete — sem ele, a sujeira do dia a dia se acumula mais visivelmente." },
      { nome: "Produtos de limpezas", qtd: "—", desc: "Diversos", impacto: "Sem nenhum produto de limpeza disponível, o hóspede não tem como resolver nem um pequeno acidente doméstico sozinho." },
      { nome: "Balde", qtd: "1", desc: "Apoio a limpeza", impacto: "Sem balde, qualquer limpeza que precise de água (chão, por exemplo) fica praticamente inviável de fazer bem." },
      { nome: "Varal", qtd: "1", desc: "Varão de chão, de parede, ou outro ambiente para pendurar roupas e toalhas", impacto: "Sem varal, o hóspede não tem onde secar uma roupa lavada à mão ou uma toalha de praia — sentido especialmente em imóveis de praia." },
      { nome: "Pregador de roupas", qtd: "—", desc: "1 kit de pregador de roupas", impacto: "Sem pregador, o varal perde parte da utilidade — a roupa pendurada pode até cair com o vento." },
    ],
  },
  {
    nome: "Serviços e itens essenciais",
    itens: [
      { nome: "Netflix/Primevideo", qtd: "1", desc: "Escolha Netflix ou semelhantes para substituir a TV a cabo", impacto: "TV a cabo sem streaming é vista como desatualizada — a falta de Netflix/Prime é um dos pontos mais comentados em avaliações negativas de entretenimento." },
      { nome: "Internet Fibra", qtd: "1", desc: "De preferência internet de 25 mb em diante", impacto: "Internet lenta ou instável é um dos motivos mais citados em avaliações ruins hoje em dia — muitos hóspedes trabalham remotamente durante a viagem e dependem disso." },
      { nome: "Armário de manutenção", qtd: "1", desc: "Lugar com chave/cadeado/locker para guardar enxoval e itens de limpeza em geral", impacto: "Sem um lugar próprio e trancado para guardar enxoval/produtos reserva, a reposição fica desorganizada e mais lenta entre uma hospedagem e outra — problema operacional, não só de hóspede." },
    ],
  },
];

export function checklistItemKey(categoriaIndex: number, itemIndex: number) {
  return `c${categoriaIndex}_i${itemIndex}`;
}

export type ChecklistCategoriaResultado = {
  categoria: string;
  checados: number;
  total: number;
};

export type ChecklistSugestao = { categoria: string; item: string; desc: string; impacto: string };

export type ChecklistScoreInfo = {
  nota: number;
  totalChecados: number;
  totalItens: number;
  detalhes: ChecklistCategoriaResultado[];
  sugestoes: ChecklistSugestao[];
};

// Peso igual por categoria (decisão do usuário): cada uma das 7 categorias
// vale 1/7 da nota final, independente de quantos itens ela tem.
export function checklistScoreInfo(itens: Record<string, boolean> | null | undefined): ChecklistScoreInfo {
  const marcados = itens || {};
  let somaPct = 0;
  const detalhes: ChecklistCategoriaResultado[] = [];
  const sugestoes: ChecklistSugestao[] = [];

  CHECKLIST_APTO_CATEGORIAS.forEach((cat, ci) => {
    const total = cat.itens.length;
    let checados = 0;
    cat.itens.forEach((item, ii) => {
      const key = checklistItemKey(ci, ii);
      if (marcados[key]) {
        checados++;
      } else {
        sugestoes.push({ categoria: cat.nome, item: item.nome, desc: item.desc, impacto: item.impacto });
      }
    });
    somaPct += total ? checados / total : 1;
    detalhes.push({ categoria: cat.nome, checados, total });
  });

  const nota = CHECKLIST_APTO_CATEGORIAS.length ? (somaPct / CHECKLIST_APTO_CATEGORIAS.length) * 10 : 0;
  const totalChecados = detalhes.reduce((s, d) => s + d.checados, 0);
  const totalItens = detalhes.reduce((s, d) => s + d.total, 0);

  return { nota: Math.round(nota * 10) / 10, totalChecados, totalItens, detalhes, sugestoes };
}
