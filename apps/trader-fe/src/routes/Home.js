import React from 'react';
import gql from "graphql-tag";
import { graphql } from "react-apollo";

const quoteRequestSubscription = gql`
	{
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

  render() {
    const { data } = this.props;

    if(!data) return null;

    return (
      <ul>
        {openQuoteRequests.map(quoteRequest => (
          <li>
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
  options: () => ({
    fetchPolicy: 'cache-and-network',
  }),
  props: props => ({
    subscribeToNewQuoteRequest: params =>
      props.data.subscribeToMore({
        document: quoteRequestSubscription,
        variables: params,
        // TODO BUG: need to filter tweets based on more fine grained / unique value if possible
        updateQuery: (prev, { subscriptionData: { data: { subscribeToQuoteRequest } } }) => {
          console.log(prev);
          const alreadyExists = prev.openQuoteRequests.find(
            item => item.id === subscribeToQuoteRequest.id
          );
          if (alreadyExists) {
            return { ...prev };
          }
          return {
            ...prev,
            openQuoteRequests: [
              ...prev.openQuoteRequests,
              subscribeToQuoteRequest,
            ]
          }
        }
      })
  }),
})(Home);
