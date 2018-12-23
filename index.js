function withCommas (x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function keyBy (array, key) {
  return array.reduce((labels, x) => {
    return Object.assign({}, labels, {
      [x[key]]: x
    })
  }, {})
}

const denoms = [
  {
    label: 'T',
    ratio: 1e12
  },
  {
    label: 'B',
    ratio: 1e9
  },
  {
    label: 'M',
    ratio: 1e6
  },
  {
    label: 'K',
    ratio: 1e3
  },
  {
    label: '',
    ratio: 1
  }
]

const enabledDenoms = denoms.filter(x => x.ratio <= 1e9)

export class MoneyPouch {
  constructor (amount) {
    this.amount = amount
  }

  format (formatter = null) {
    let fn = formatter || withCommas

    return fn(this.amount)
  }
}

export class Conversions {
  constructor (denominations) {
    this.denominations = denominations.map(x => Object.assign(x, {
      label: x.label.toUpperCase()
    }))
    this.labelIndex = keyBy(denominations, 'label')
  }

  findLabel (label) {
    return this.labelIndex[label.toUpperCase()]
  }

  matchDenomination (amount, max) {
    const x = Math.abs(amount)
    return this.denominations.find(denom => {
      return denom.ratio >= max && denom.ratio <= x
    })
  }

  format (amount, max = 1, precision = 3) {
    if (!amount || amount === 0) {
      return '0'
    }

    const denom = this.matchDenomination(amount, max)
    const final = withCommas((amount / denom.ratio).toFixed(precision))
    return final.replace(/\.?0+$/, '') + denom.label
  }

  parse (s) {
    s = (s || '').trim().toUpperCase().replace(',', '')
    if (s === null || s === undefined || s.length === 0) {
      return new MoneyPouch(0)
    }

    let amount = Math.round(parseFloat(s))
    const denomination = this.findLabel(s[s.length - 1])
    if (denomination) {
      const payload = s.substring(0, s.length - 1)
      if (payload.length === 0) {
        return new MoneyPouch(0)
      }

      amount = Math.round(payload * denomination.ratio)
    }

    return new MoneyPouch(amount)
  }
}

export const defaultConvertor = new Conversions(enabledDenoms)

export function rsgpMixin (convertor = null) {
  convertor = convertor || new Conversions(enabledDenoms)
  return {
    methods: {
      rsgp (x, max = 1, precision = 3) {
        return defaultConvertor.format(x, max, precision)
      },
      parseGp (s) {
        return defaultConvertor.parse(s).amount
      }
    }
  }
}
