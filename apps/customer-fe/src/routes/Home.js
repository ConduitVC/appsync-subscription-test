import React from 'react';
import gql from "graphql-tag";
import { compose, graphql } from "react-apollo";

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

const openQuoteResponses = gql`
	{
    openQuoteResponses {
        id
        ask
        expires
        quoteResponse {
          id
          commodity
          amount
        }
    }
  }
`;

const quoteResponseSubscription = gql`
	subscription NewQuoteResponseSub {
    subscribeToQuoteResponse {
        id
        ask
        expires
        quoteRequest {
          id
          amount
          commodity
        }
    }
  }
`;

const passOnResponse =  gql`
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
  
  state = { }
  
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

  handlePassQuoteResponse = quoteResponseId => async e => {
  }

  componentDidMount() {
    this.subscription = this.props.subscribeToNewQuoteResponses();
  }

  componentWillUnmount() {
    this.subscription(); // NOTE removes the subscription
  }

  render() {
    const { data } = this.props;

    return (
      <div>
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
        <ul>
          {data && data.openQuoteResponses && data.openQuoteResponses.map(quoteResponse => (
            <li key={quoteResponse.id}>
              <span>Commodity:{quoteResponse.quoteRequest.commodity}</span>
              <span>[{quoteResponse.quoteRequest.amount}]</span>
              <span>[{quoteResponse.ask}]</span>
              <button onClick={this.handlePassQuoteResponse(quoteResponse.id)}>Pass</button>
              <button onClick={this.handleAcceptQuoteResponse(quoteResponse.id)}>Accept</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default compose(
  graphql(openQuoteResponses, {
    options: {
      fetchPolicy: 'network-only',
    },
    props: props => ({
      ...props,
      subscribeToNewQuoteResponses: () =>
        props.data.subscribeToMore({
          document: quoteResponseSubscription,
          variables: {},
          updateQuery: (prev, { subscriptionData: { data, errors } }) => {
            if(errors || !data) return { ...prev };

            const alreadyExists = prev.openQuoteResponses.find(
              item => item.id === data.subscribeToQuoteResponse.id
            );
            if (alreadyExists) {
              return { ...prev };
            }
            
            return Object.assign( {}, prev,
              { openQuoteResponses: [ data.subscribeToQuoteResponse, ...prev.openQuoteResponses ] }
            )
          }
        })
    }),
  }),
  graphql(requestQuote)
)(Home);
