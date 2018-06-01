import React from 'react';
import gql from "graphql-tag";
import { graphql } from "react-apollo";

const requestQuote =  gql`
	mutation requestQuote($quoteRequest: QuoteRequestInput!) {
    requestQuote(quoteRequest: $quoteRequest) {
      id
      amount
      commodity
      customerId
    }
  }
`;

class Home extends React.Component {
  
  handleButtonClick = e => {
    e.preventDefault();
  }

  handleButtonClick = async e => {
    e.preventDefault();
    try {
      const quoteRequest = (await this.props.mutate({
        variables: {
          quoteRequest: {
            ...this.state,
          },
        },
      })).data.requestQuote;
    
      console.log(quoteRequest);

    } catch (error) {
      console.log(error);
    }

  }

  handleChange = e => {
    const { name: meta, value } = e.target;
    const [ name, scalarType ] = meta.split('.');
    
    this.setState({
      ...this.state,
      [name]: scalarType === 'Int'
        ? Number.parseFloat(value)
        : value
     })
  }

  state = { }

  render() {
    return (
      <form>
        <div>
          <label>Commodity</label>
          <input name="commodity.String" onChange={this.handleChange} value={this.state.commodity || ''} />
        </div>
        <div>
          <label>Amount</label>
          <input name="amount.Int" onChange={this.handleChange} value={this.state.amount || ''} />
        </div>
        <button onClick={this.handleButtonClick}>Request Quote</button>
      </form>
    );
  }
}

export default graphql(requestQuote)(Home);
