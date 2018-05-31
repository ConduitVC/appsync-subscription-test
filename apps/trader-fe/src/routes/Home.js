import React from 'react';
import gql from "graphql-tag";
import { graphql } from "react-apollo";

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

class Home extends React.Component {
  
  state = {
    quoteRequests: []
  }

  componentDidMount() {
    this.subscription = this.props.subscribeToNewQuoteRequest();
  }

  componentWillUnmount() {
    this.subscription(); // NOTE removes the subscription
  }

  render() {
    const { data } = this.props;
    
    console.log(this.props);
    if(!data || !data.openQuoteRequests) return null;

    return (
      <ul>
        {data.openQuoteRequests.map(quoteRequest => (
          <li key={quoteRequest.id}>
            <span>Customer: {quoteRequest.customerId} --> </span>
            <span>{quoteRequest.commodity}</span>
            <span>[{quoteRequest.amount}]</span>
          </li>
        ))}
      </ul>
    );
  }
}

export default graphql(openQuoteRequests, {
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
          
          data.subscribeToQuoteRequest.customerId = '12';
          console.log(Object.assign( {}, prev,
            { openQuoteRequests: [ data.subscribeToQuoteRequest, ...prev.openQuoteRequests ] }
          ));
          return Object.assign( {}, prev,
            { openQuoteRequests: [ data.subscribeToQuoteRequest, ...prev.openQuoteRequests ] }
          )
        }
      })
  }),
})(Home);
