import React from 'react';
import gql from "graphql-tag";
import { compose, graphql } from "react-apollo";

const quoteRequestSubscription = gql`
	subscription NewQuoteRequestSub {
    subscribeToQuoteRequest {
        id
        amount
        commodity
        customerId
    }
  }
`;

const openQuoteRequests = gql`
	{
    openQuoteRequests {
        id
        amount
        commodity
        customerId
    }
  }
`;

const respondToQuote = gql`
	mutation respondToQuote($quoteRequestId: ID!, $response: QuoteResponseInput!) {
    respondToQuote(quoteRequestId: $quoteRequestId, response: $response) {
      id 
      ask
      expires
    }
    respondedToQuote(quoteRequestId: $quoteRequestId) {
      id
    }
  }
`;

class Home extends React.Component {
  
  state = {
    asks: { }
  }

  componentDidMount() {
    this.subscription = this.props.subscribeToNewQuoteRequest();
  }

  componentWillUnmount() {
    this.subscription(); // NOTE removes the subscription
  }

  handleAskChange = e => {
    const { name: requestQuoteId, value } = e.target;
    
    this.setState({
      ...this.state,
      asks: {
        ...this.state.asks,
        [requestQuoteId]: value
      }
    })
  }

  handleCreateQuoteResponse = quoteRequestId => ( async () => {
    const ask = Number.parseFloat(this.state.asks[quoteRequestId])

    console.log(ask);
    console.log(quoteRequestId);
    if(Number.isNaN(ask)) {
      return
    }
 
    try {
      const quoteResponse = (await this.props.mutate({
        variables: {
          quoteRequestId,
          response: {
            ask
          }
        },
      })).data.respondToQuote;
    
      console.log(quoteResponse);

    } catch (error) {
      console.log(error);
    }   
  } )

  render() {
    const { data } = this.props;
    
    if(!data || !data.openQuoteRequests) return null;

    return (
      <ul>
        {data.openQuoteRequests.map(quoteRequest => (
          <li key={quoteRequest.id}>
            <span>Customer: {quoteRequest.customerId} --> </span>
            <span>{quoteRequest.commodity}</span>
            <span>[{quoteRequest.amount}]</span>
            <input name={quoteRequest.id} onChange={this.handleAskChange} value={this.state.asks[quoteRequest.id] || ''} />
            <button onClick={this.handleCreateQuoteResponse(quoteRequest.id)}>Respond</button>
          </li>
        ))}
      </ul>
    );
  }
}

export default compose(
  graphql(openQuoteRequests, {
    options: {
      fetchPolicy: 'network-only',
    },
    props: props => ({
      ...props,
      subscribeToNewQuoteRequest: () =>
        props.data.subscribeToMore({
          document: quoteRequestSubscription,
          variables: {},
          updateQuery: (prev, { subscriptionData: { data, errors } }) => {
            if(errors || !data) return { ...prev };

            const alreadyExists = prev.openQuoteRequests.find(
              item => item.id === data.subscribeToQuoteRequest.id
            );
            if (alreadyExists) {
              return { ...prev };
            }
            
            return Object.assign( {}, prev,
              { openQuoteRequests: [ data.subscribeToQuoteRequest, ...prev.openQuoteRequests ] }
            )
          }
        })
    }),
  }),
  graphql(respondToQuote)
)(Home);
